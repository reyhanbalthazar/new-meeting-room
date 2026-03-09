import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../api.service';
import { Booking } from '../../../models/booking.model'; // Import the shared Booking interface
import { interval, Observable, Subject, switchMap, takeUntil, map } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddParticipantModalComponent } from '../../../add-participant-modal/add-participant-modal.component';
import { CancelBookingModalComponent } from '../../../cancel-booking-modal/cancel-booking-modal.component';
import { DisasterAlertModalComponent } from '../../../disaster-alert-modal/disaster-alert-modal.component';

interface DateFormatOptions {
  time: Intl.DateTimeFormatOptions;
  day: Intl.DateTimeFormatOptions;
  date: Intl.DateTimeFormatOptions;
  month: Intl.DateTimeFormatOptions;
  fullDate: Intl.DateTimeFormatOptions;
}

interface RoomAdsItem {
  orderIndex: number;
  durationSeconds: number;
  name: string;
  type: string;
  fileUrl: string;
  mimeType: string;
}

@Component({
  selector: 'app-each-room',
  templateUrl: './each-room.component.html',
  styleUrls: ['./each-room.component.css'],
})
export class EachRoomComponent implements OnInit, OnDestroy {
  @ViewChild('currentAdVideoEl') currentAdVideoEl?: ElementRef<HTMLVideoElement>;

  // Data
  dataBookings: any[] = []; // Calendar data with months and dates
  filteredBookings: any[] = []; // Filtered calendar data

  // State
  selectedRoom: number | null = null;
  selectedRoomName: string = '';
  isAdsEnable: boolean = true;
  selectedDate: Date = new Date();
  roomBackgroundImage: string = '../../../../assets/landscape-bg.jpg';
  portraitBackgroundImage: string = '../../../../assets/potrait-bg.jpg';
  roomCapacity: number | null = null;
  roomDescription: string = 'Belum ada deskripsi ruangan.';
  roomAdsItems: RoomAdsItem[] = [];
  currentAdIndex: number = 0;
  currentAdFileUrl: string = '';
  currentAdType: string = '';
  currentAdName: string = '';
  currentAdVideoError: string = '';
  private stopCurrentVideoAutoplayRetry: boolean = false;
  signageOrientation: 'LANDSCAPE' | 'PORTRAIT' = 'LANDSCAPE';

  // Configuration
  private readonly UPDATE_INTERVAL_MS = 10000;
  private readonly DISASTER_UPDATE_INTERVAL_MS = 1000;
  private readonly LIVE_CLOCK_INTERVAL_MS = 1000;
  private readonly PREPARE_VIDEO_MAX_RETRIES = 6;
  private readonly PREPARE_VIDEO_RETRY_DELAY_MS = 50;
  private readonly AUTOPLAY_MAX_ATTEMPTS = 4;
  private readonly AUTOPLAY_RETRY_DELAY_MS = 250;
  private readonly AUTOPLAY_PROBE_MAX_RETRIES = 2;
  private readonly AUTOPLAY_PROBE_RETRY_DELAY_MS = 300;
  private readonly defaultLandscapeBackgroundImage = '../../../../assets/landscape-bg.jpg';
  private readonly defaultPortraitBackgroundImage = '../../../../assets/potrait-bg.jpg';
  private readonly DISASTER_ALERT_SOUND_INTERVAL_MS = 1600;
  private readonly destroy$ = new Subject<void>();
  private adRotationTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastDisasterChangedAt: string = '';
  private lastSignageSignature: string = '';
  private disasterDialogRef: MatDialogRef<DisasterAlertModalComponent> | null = null;
  private disasterAlertAudioContext: AudioContext | null = null;
  private disasterAlertSoundInterval: ReturnType<typeof setInterval> | null = null;

  // Date formatting options
  private readonly dateFormatOptions: DateFormatOptions = {
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    day: { weekday: 'long' },
    date: { year: 'numeric', month: 'long', day: 'numeric' },
    month: { month: 'long' },
    fullDate: { year: 'numeric', month: 'long', day: 'numeric' }
  };

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.clearAdRotationTimeout();
    this.closeDisasterDialog();
    this.stopDisasterAlertSound();
    this.stopCurrentVideoAutoplayRetry = true;
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component state and start data fetching
   */
  private initializeComponent(): void {
    this.initializeRoomFromRoute();
    this.roomBackgroundImage = this.defaultLandscapeBackgroundImage;
    this.portraitBackgroundImage = this.defaultPortraitBackgroundImage;
    this.fetchRoomSettings();
    this.fetchBookings();
    this.fetchDisasterStatus();
    this.setupLiveClock();
    this.setupPeriodicUpdates();
    this.setupRoomSettingsPolling();
    this.setupDisasterPolling();
  }

  /**
   * Keep room header clock/date in sync with current time.
   */
  private setupLiveClock(): void {
    interval(this.LIVE_CLOCK_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedDate = new Date();
      });
  }

  /**
   * Get room ID from route parameters
   */
  private initializeRoomFromRoute(): void {
    const roomId = this.route.snapshot.paramMap.get('id');
    this.selectedRoom = roomId ? Number(roomId) : null;
  }

  /**
   * Fetch bookings for the selected room
   */
  fetchBookings(): void {
    if (!this.selectedRoom) {
      return;
    }

    this.apiService.getDataBookingsByRoomIdCalendar(this.selectedRoom).subscribe({
      next: (response: any) => {
        // Ensure response.data is an array before assigning
        this.dataBookings = Array.isArray(response?.data) ? response.data : [];
        this.filterBookingsByDate(); // Show all bookings
        console.debug('Fetched calendar bookings for room:', response);
      },
      error: (error) => {
        console.error('Error fetching calendar bookings:', error);
        this.dataBookings = []; // Clear data on error
        this.filteredBookings = []; // Also clear filtered bookings
      }
    });
  }

  /**
   * Fetch room settings and map signage background to UI background
   */
  private fetchRoomSettings(): void {
    if (!this.selectedRoom) {
      return;
    }

    this.apiService.getRoomById(this.selectedRoom).subscribe({
      next: (response: any) => {
        this.applyRoomSettings(response?.data);
      },
      error: (error) => {
        console.error('Error fetching room settings:', error);
      }
    });
  }

  /**
   * Set up periodic updates for room settings/signage changes
   */
  private setupRoomSettingsPolling(): void {
    interval(this.UPDATE_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.getUpdatedRoomSettings())
      )
      .subscribe({
        next: (room: any) => {
          this.applyRoomSettings(room);
        },
        error: (error) => {
          console.error('Error during room settings polling:', error);
        }
      });
  }

  /**
   * Set up periodic updates for bookings
   */
  private setupPeriodicUpdates(): void {
    interval(this.UPDATE_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.getUpdatedBookings())
      )
      .subscribe({
        next: (calendarData: any[]) => {
          this.dataBookings = calendarData;
          this.filterBookingsByDate(); // Show all bookings (no date filter)
          console.debug('Updated calendar bookings:', calendarData);
        },
        error: (error) => {
          console.error('Error during periodic updates:', error);
        }
      });
  }

  /**
   * Set up periodic updates for disaster status
   */
  private setupDisasterPolling(): void {
    interval(this.DISASTER_UPDATE_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.apiService.getDisasterStatus())
      )
      .subscribe({
        next: (response: any) => {
          this.handleDisasterStatusResponse(response);
        },
        error: (error) => {
          console.error('Error during disaster status polling:', error);
        }
      });
  }

  /**
   * Fetch disaster status once on init
   */
  private fetchDisasterStatus(): void {
    this.apiService.getDisasterStatus().subscribe({
      next: (response: any) => {
        this.handleDisasterStatusResponse(response);
      },
      error: (error) => {
        console.error('Error fetching disaster status:', error);
      }
    });
  }

  /**
   * Show alert popup when disaster is active
   */
  private handleDisasterStatusResponse(response: any): void {
    const disasterData = response?.data;
    const isDisaster = disasterData?.is_disaster === true;
    const changedAt = typeof disasterData?.last_changed_at === 'string' ? disasterData.last_changed_at : '';

    // Reset tracker when disaster state is cleared, so a future true state can alert again.
    if (!isDisaster) {
      this.lastDisasterChangedAt = '';
      this.closeDisasterDialog();
      return;
    }

    // Avoid repeated alerts for the same disaster status snapshot.
    if (changedAt && this.lastDisasterChangedAt === changedAt) {
      return;
    }

    this.lastDisasterChangedAt = changedAt || new Date().toISOString();

    const note = typeof disasterData?.note === 'string' && disasterData.note.trim().length > 0
      ? disasterData.note
      : 'Emergency status is active.';

    this.openDisasterDialog(note);
  }

  /**
   * Get updated bookings observable
   */
  private getUpdatedBookings(): Observable<any> {
    if (!this.selectedRoom) {
      return new Observable<any>(observer => {
        observer.next({ data: [] });
        observer.complete();
      });
    }
    return this.apiService.getDataBookingsByRoomIdCalendar(this.selectedRoom).pipe(
      map((response: any) => {
        // Ensure response.data is an array before returning
        return Array.isArray(response?.data) ? response.data : [];
      })
    );
  }

  /**
   * Get updated room settings observable
   */
  private getUpdatedRoomSettings(): Observable<any> {
    if (!this.selectedRoom) {
      return new Observable<any>(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    return this.apiService.getRoomById(this.selectedRoom).pipe(
      map((response: any) => response?.data ?? null)
    );
  }

  /**
   * Apply room settings and react only when signage payload changes
   */
  private applyRoomSettings(room: any): void {
    this.selectedRoomName = room?.name ?? '';
    this.roomCapacity = typeof room?.capacity === 'number' ? room.capacity : null;
    this.roomDescription = typeof room?.description === 'string' && room.description.trim().length > 0
      ? room.description
      : 'Belum ada deskripsi ruangan.';

    const nextSignageSignature = this.buildSignageSignature(room?.signage);
    if (nextSignageSignature === this.lastSignageSignature) {
      return;
    }

    this.lastSignageSignature = nextSignageSignature;
    this.signageOrientation = room?.signage?.orientation === 'PORTRAIT' ? 'PORTRAIT' : 'LANDSCAPE';
    this.roomAdsItems = this.mapRoomAdsItems(room?.signage?.ads_items);
    this.isAdsEnable = this.roomAdsItems.length > 0;
    this.startAdsRotation();

    const backgroundUrl = room?.signage?.background?.file_url;
    if (typeof backgroundUrl === 'string' && backgroundUrl.trim().length > 0) {
      const normalizedBackgroundUrl = this.normalizeMediaUrl(backgroundUrl);
      this.roomBackgroundImage = normalizedBackgroundUrl;
      this.portraitBackgroundImage = normalizedBackgroundUrl;
      return;
    }

    this.roomBackgroundImage = this.defaultLandscapeBackgroundImage;
    this.portraitBackgroundImage = this.defaultPortraitBackgroundImage;
  }

  /**
   * Create a stable signature for signage payload change detection.
   */
  private buildSignageSignature(signage: any): string {
    if (!signage) {
      return '';
    }

    const adsItems = Array.isArray(signage?.ads_items)
      ? signage.ads_items.map((item: any) => ({
        order_index: item?.order_index ?? null,
        duration_seconds: item?.duration_seconds ?? null,
        ads_id: item?.ads?.id ?? null,
        ads_name: item?.ads?.name ?? '',
        ads_type: item?.ads?.type ?? '',
        ads_file_url: item?.ads?.file_url ?? '',
        ads_mime_type: item?.ads?.mime_type ?? '',
        ads_is_active: item?.ads?.is_active !== false
      }))
      : [];

    return JSON.stringify({
      id: signage?.id ?? null,
      layout: signage?.layout ?? '',
      orientation: signage?.orientation ?? '',
      background_url: signage?.background?.file_url ?? '',
      background_id: signage?.background?.id ?? null,
      ads_assignment_version: signage?.ads_assignment_version ?? null,
      ads_items: adsItems
    });
  }

  /**
   * Format time string - handles both ISO datetime and time-only strings
   */
  formatTime(timeString: string): string {
    try {
      // Check if it's a time-only string (HH:mm:ss format)
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
        // Just return the time portion without seconds
        return timeString.substring(0, 5); // Returns HH:mm
      }

      // For ISO datetime strings, convert to time
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        // If it's an invalid date, return the original string
        return timeString;
      }

      return date.toLocaleTimeString('en-ID', this.dateFormatOptions.time);
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString; // Fallback to original string
    }
  }

  /**
   * Get formatted time part from selected date
   */
  getTimePart(): string {
    return this.selectedDate.toLocaleTimeString('en-ID', this.dateFormatOptions.time);
  }

  /**
   * Get formatted day part from selected date
   */
  getDayPart(): string {
    return this.selectedDate.toLocaleDateString('en-ID', this.dateFormatOptions.day);
  }

  /**
   * Get formatted date part from selected date
   */
  getDatePart(): string {
    return this.selectedDate.toLocaleDateString('en-ID', this.dateFormatOptions.date);
  }

  formatMonth(monthString: string): string {
    if (!monthString) {
      return '';
    }

    const monthDate = new Date(`${monthString}-01T00:00:00`);
    if (isNaN(monthDate.getTime())) {
      return monthString;
    }

    return monthDate.toLocaleDateString('en-ID', this.dateFormatOptions.month);
  }

  formatServerDate(dateString: string): string {
    if (!dateString) {
      return '';
    }

    const parsedDate = new Date(`${dateString}T00:00:00`);
    if (isNaN(parsedDate.getTime())) {
      return dateString;
    }

    return parsedDate.toLocaleDateString('en-ID', this.dateFormatOptions.fullDate);
  }

  /**
   * Get total number of scheduled bookings
   */
  getTotalScheduleCount(): number {
    let count = 0;
    this.filteredBookings.forEach((monthData: any) => {
      monthData.dates.forEach((dateData: any) => {
        count += dateData.schedules.length;
      });
    });
    return count;
  }

  /**
   * Show all bookings without filtering by date
   */
  private filterBookingsByDate(): void {
    // Assign all calendar data to filteredBookings to show everything
    this.filteredBookings = [...this.dataBookings]; // Create a copy to avoid reference issues

    console.debug(`Showing all bookings (no date filter applied):`, this.filteredBookings);
  }

  /**
   * Check if there are any bookings
   */
  get hasBookings(): boolean {
    return this.getTotalScheduleCount() > 0;
  }

  /**
   * Add participant to a booking
   */
  addParticipantToBooking(booking: Booking): void {
    console.log('Add participant to booking:', booking);

    const dialogRef = this.dialog.open(AddParticipantModalComponent, {
      width: '400px',
      data: {
        bookingId: booking.id,
        bookingEmail: booking.email, // Use the email of the booking owner for confirmation
        title: 'Tambah Peserta Meeting',
        message: 'Silakan masukkan detail peserta yang ingin ditambahkan',
        subMessage: 'Untuk melanjutkan, silahkan masukkan alamat email PIC yang digunakan saat melakukan reservasi.',
        button1: 'Tambahkan',
        button2: 'Batal',
        type: 'confirmation',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Participant added successfully:', result);
        // Refresh the bookings list to show the updated participant list
        this.fetchBookings();
        alert(`Peserta ${result.participantName} (${result.participantEmail}) berhasil ditambahkan ke booking: ${booking.topic}`);
      } else {
        console.log('Add participant cancelled');
      }
    });
  }

  /**
   * Cancel a booking
   */
  cancelBooking(booking: Booking): void {
    console.log('Cancel booking:', booking);

    const dialogRef = this.dialog.open(CancelBookingModalComponent, {
      width: '400px',
      data: {
        bookingId: booking.id,
        bookingEmail: booking.email, // Use the email of the booking owner for confirmation
        title: 'Batalkan Meeting',
        message: 'Anda akan menghapus jadwal meeting yang telah Anda buat.',
        subMessage: 'Untuk melanjutkan, silahkan masukkan alamat email yang digunakan saat melakukan reservasi.',
        button1: 'Lanjutkan',
        button2: 'Kembali',
        type: 'confirmation',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Booking cancelled successfully');
        // Refresh the bookings list
        this.fetchBookings();
      } else {
        console.log('Cancellation cancelled');
      }
    });
  }

  /**
   * Check if current ad is image type
   */
  get isCurrentAdImage(): boolean {
    return this.currentAdType === 'IMAGE';
  }

  /**
   * Check if current ad is video type
   */
  get isCurrentAdVideo(): boolean {
    return this.currentAdType === 'VIDEO';
  }

  /**
   * Move to the next ad item in slideshow
   */
  moveToNextAd(): void {
    if (!this.isAdsEnable || this.roomAdsItems.length === 0) {
      return;
    }

    this.currentAdIndex = (this.currentAdIndex + 1) % this.roomAdsItems.length;
    this.setCurrentAdAndScheduleNext();
  }

  /**
   * Handle video ended event for current ad
   */
  onCurrentAdVideoEnded(): void {
    if (!this.isCurrentAdVideo) {
      return;
    }

    this.clearAdRotationTimeout();
    this.moveToNextAd();
  }

  /**
   * Map raw API ads_items into normalized ads list
   */
  private mapRoomAdsItems(rawAdsItems: any): RoomAdsItem[] {
    if (!Array.isArray(rawAdsItems)) {
      return [];
    }

    return rawAdsItems
      .map((item: any): RoomAdsItem | null => {
        const ads = item?.ads;
        const fileUrl = typeof ads?.file_url === 'string' ? this.normalizeMediaUrl(ads.file_url) : '';
        const isActive = ads?.is_active !== false;
        const mimeType = typeof ads?.mime_type === 'string' ? ads.mime_type.toLowerCase() : '';
        const type = this.resolveAdsType(ads?.type, mimeType, fileUrl);

        if (!fileUrl || !isActive) {
          return null;
        }

        return {
          orderIndex: typeof item?.order_index === 'number' ? item.order_index : Number.MAX_SAFE_INTEGER,
          durationSeconds: typeof item?.duration_seconds === 'number' && item.duration_seconds > 0 ? item.duration_seconds : 5,
          name: typeof ads?.name === 'string' ? ads.name : '',
          type,
          fileUrl,
          mimeType
        };
      })
      .filter((item: RoomAdsItem | null): item is RoomAdsItem => item !== null)
      .sort((a: RoomAdsItem, b: RoomAdsItem) => a.orderIndex - b.orderIndex);
  }

  /**
   * Start automatic ads slideshow rotation
   */
  private startAdsRotation(): void {
    this.clearAdRotationTimeout();

    if (!this.isAdsEnable || this.roomAdsItems.length === 0) {
      this.resetCurrentAdState();
      return;
    }

    this.currentAdIndex = 0;
    this.setCurrentAdAndScheduleNext();
  }

  /**
   * Set the current ad and schedule the next item
   */
  private setCurrentAdAndScheduleNext(): void {
    this.clearAdRotationTimeout();

    const currentAd = this.roomAdsItems[this.currentAdIndex];
    if (!currentAd) {
      return;
    }

    this.applyCurrentAd(currentAd);

    if (currentAd.type === 'VIDEO') {
      // Prime and autoplay after element/source is rendered.
      setTimeout(() => this.prepareCurrentAdVideo(0), this.PREPARE_VIDEO_RETRY_DELAY_MS);
    }

    // Image slideshow always uses timer.
    if (currentAd.type === 'IMAGE') {
      this.scheduleNextAdAfter(currentAd.durationSeconds);
      return;
    }

    // Video slideshow advances from "ended" event.
    // Keep fallback timer only when there are multiple ads.
    if (this.roomAdsItems.length > 1) {
      this.scheduleNextAdAfter(currentAd.durationSeconds);
    }
  }

  /**
   * Reset current ad state when slideshow has no playable item.
   */
  private resetCurrentAdState(): void {
    this.currentAdIndex = 0;
    this.currentAdFileUrl = '';
    this.currentAdType = '';
    this.currentAdName = '';
    this.currentAdVideoError = '';
  }

  /**
   * Apply active ad data into component state.
   */
  private applyCurrentAd(currentAd: RoomAdsItem): void {
    this.currentAdFileUrl = currentAd.fileUrl;
    this.currentAdType = currentAd.type;
    this.currentAdName = currentAd.name;
    this.currentAdVideoError = '';
    this.stopCurrentVideoAutoplayRetry = false;
  }

  /**
   * Schedule slideshow advance by ad duration.
   */
  private scheduleNextAdAfter(durationSeconds: number): void {
    this.adRotationTimeout = setTimeout(() => {
      this.moveToNextAd();
    }, durationSeconds * 1000);
  }

  /**
   * Clear slideshow timeout safely
   */
  private clearAdRotationTimeout(): void {
    if (this.adRotationTimeout) {
      clearTimeout(this.adRotationTimeout);
      this.adRotationTimeout = null;
    }
  }

  /**
   * Resolve media type from ads.type with mime-type fallback
   */
  private resolveAdsType(rawType: any, mimeType: string, fileUrl: string): 'IMAGE' | 'VIDEO' {
    const type = typeof rawType === 'string' ? rawType.toUpperCase() : '';
    if (type === 'VIDEO' || type === 'IMAGE') {
      return type;
    }

    if (mimeType.startsWith('video/')) {
      return 'VIDEO';
    }

    if (this.isVideoFileUrl(fileUrl)) {
      return 'VIDEO';
    }

    return 'IMAGE';
  }

  /**
   * Detect video media when API type/mime is missing but URL uses video extension.
   */
  private isVideoFileUrl(fileUrl: string): boolean {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(fileUrl);
  }

  /**
   * Normalize media URL.
   */
  private normalizeMediaUrl(rawUrl: string): string {
    const url = rawUrl.trim();
    if (!url) {
      return '';
    }

    try {
      const parsedUrl = new URL(url, window.location.origin);
      return parsedUrl.toString();
    } catch {
      // Fallback for malformed/non-standard URLs.
    }

    return url;
  }

  /**
   * Ensure the current video element is loaded before autoplay attempts.
   */
  private prepareCurrentAdVideo(retryAttempt: number): void {
    const video = this.currentAdVideoEl?.nativeElement;
    if (!video) {
      if (retryAttempt < this.PREPARE_VIDEO_MAX_RETRIES) {
        setTimeout(() => this.prepareCurrentAdVideo(retryAttempt + 1), this.PREPARE_VIDEO_RETRY_DELAY_MS);
      }
      return;
    }

    if (this.currentAdType !== 'VIDEO' || this.stopCurrentVideoAutoplayRetry) {
      return;
    }

    // Reload source once after ad switch, then let autoplay retries handle policy timing.
    video.load();
    this.forceVideoAutoplay(video);
    this.tryAutoplayCurrentVideo(0);
  }

  /**
   * Retry playback as soon as metadata exists.
   */
  onCurrentAdVideoLoadedMetadata(event: Event): void {
    const video = event.target as HTMLVideoElement | null;
    if (!video) {
      return;
    }

    this.forceVideoAutoplay(video);
  }

  /**
   * Start playback as soon as browser reports enough buffered data.
   */
  onCurrentAdVideoCanPlay(event: Event): void {
    const video = event.target as HTMLVideoElement | null;
    if (!video) {
      return;
    }
    this.forceVideoAutoplay(video);
  }

  /**
   * Capture media error for easier diagnosis (codec/CORS/source issue).
   */
  onCurrentAdVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement | null;
    if (!video) {
      return;
    }

    this.currentAdVideoError = 'Video ads gagal diputar.';
    this.stopCurrentVideoAutoplayRetry = true;

    console.error(
      'Current ad video failed to load/play.',
      'Error code:', video.error?.code ?? 'unknown',
      'Source:', video.currentSrc || video.src
    );
  }

  /**
   * Force autoplay with retries to satisfy strict autoplay policies.
   */
  private forceVideoAutoplay(video: HTMLVideoElement): void {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');

    const attemptPlay = (attempt: number): void => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          const isAbortError = error instanceof DOMException && error.name === 'AbortError';
          if (attempt < this.AUTOPLAY_MAX_ATTEMPTS) {
            setTimeout(() => attemptPlay(attempt + 1), this.AUTOPLAY_RETRY_DELAY_MS);
            return;
          }
          if (!isAbortError) {
            console.warn('Unable to autoplay current ad video after retries:', error);
          }
        });
      }
    };

    attemptPlay(1);
  }

  /**
   * Aggressive autoplay retries on current rendered ad video element.
   */
  private tryAutoplayCurrentVideo(retryAttempt: number): void {
    const video = this.currentAdVideoEl?.nativeElement;
    if (!video || this.currentAdType !== 'VIDEO' || this.stopCurrentVideoAutoplayRetry) {
      return;
    }

    this.forceVideoAutoplay(video);

    if (retryAttempt >= this.AUTOPLAY_PROBE_MAX_RETRIES) {
      return;
    }

    setTimeout(() => {
      if (this.currentAdType === 'VIDEO' && video.paused) {
        this.tryAutoplayCurrentVideo(retryAttempt + 1);
      }
    }, this.AUTOPLAY_PROBE_RETRY_DELAY_MS);
  }

  /**
   * Open disaster alert dialog
   */
  private openDisasterDialog(note: string): void {
    if (this.disasterDialogRef) {
      this.disasterDialogRef.componentInstance.data = { note };
      return;
    }

    this.disasterDialogRef = this.dialog.open(DisasterAlertModalComponent, {
      width: '96vw',
      maxWidth: '96vw',
      height: '92vh',
      maxHeight: '92vh',
      disableClose: true,
      data: { note }
    });

    this.startDisasterAlertSound();

    this.disasterDialogRef.afterClosed().subscribe(() => {
      this.stopDisasterAlertSound();
      this.disasterDialogRef = null;
    });
  }

  /**
   * Close disaster alert dialog if opened
   */
  private closeDisasterDialog(): void {
    if (this.disasterDialogRef) {
      this.disasterDialogRef.close();
      this.disasterDialogRef = null;
    }

    this.stopDisasterAlertSound();
  }

  /**
   * Play a repeating alert tone while the disaster modal is visible.
   */
  private startDisasterAlertSound(): void {
    if (this.disasterAlertSoundInterval) {
      return;
    }

    this.playDisasterAlertTone();
    this.disasterAlertSoundInterval = setInterval(() => {
      this.playDisasterAlertTone();
    }, this.DISASTER_ALERT_SOUND_INTERVAL_MS);
  }

  /**
   * Stop repeating alert tone and release browser audio resources.
   */
  private stopDisasterAlertSound(): void {
    if (this.disasterAlertSoundInterval) {
      clearInterval(this.disasterAlertSoundInterval);
      this.disasterAlertSoundInterval = null;
    }

    if (this.disasterAlertAudioContext) {
      void this.disasterAlertAudioContext.close().catch((error) => {
        console.warn('Unable to close disaster alert audio context:', error);
      });
      this.disasterAlertAudioContext = null;
    }
  }

  /**
   * Generate a short two-tone alarm using Web Audio API.
   */
  private playDisasterAlertTone(): void {
    const AudioContextCtor = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    try {
      if (!this.disasterAlertAudioContext || this.disasterAlertAudioContext.state === 'closed') {
        this.disasterAlertAudioContext = new AudioContextCtor();
      }

      const audioContext = this.disasterAlertAudioContext;
      if (audioContext.state === 'suspended') {
        void audioContext.resume().catch((error) => {
          console.warn('Unable to resume disaster alert audio context:', error);
        });
      }

      const startAt = audioContext.currentTime + 0.02;
      this.scheduleDisasterBeep(audioContext, startAt, 880, 0.18, 0.08);
      this.scheduleDisasterBeep(audioContext, startAt + 0.26, 660, 0.22, 0.08);
    } catch (error) {
      console.warn('Unable to play disaster alert sound:', error);
    }
  }

  /**
   * Schedule a single short beep.
   */
  private scheduleDisasterBeep(
    audioContext: AudioContext,
    startAt: number,
    frequency: number,
    durationSeconds: number,
    peakGain: number
  ): void {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + durationSeconds + 0.02);
  }
}

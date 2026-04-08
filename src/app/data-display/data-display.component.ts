import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../api.service';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';
import { CancelModalComponent } from '../cancel-modal/cancel-modal.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-data-display',
  templateUrl: './data-display.component.html',
  styleUrls: ['./data-display.component.css']
})
export class DataDisplayComponent implements OnInit, OnDestroy {
  dataBookings: any;
  dataRooms: any;
  filteredBookings: any[] = [];
  selectedRoom: { id: number | null; name: string } = { id: null, name: 'Semua Jadwal Ruangan Meeting' };
  showMoreTabs: boolean = false;
  private initialRoomId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const roomIdParam = this.route.snapshot.queryParamMap.get('roomId');
    const parsedRoomId = roomIdParam ? Number(roomIdParam) : NaN;
    this.initialRoomId = Number.isNaN(parsedRoomId) ? null : parsedRoomId;

    // Fetch initial dataBookings
    this.fetchBookings();

    // Periodically update dataBookings every 30 seconds
    interval(10000)
      .pipe(
        switchMap(() => this.apiService.getDataBookings()),
        takeUntil(this.destroy$)
      )
      .subscribe(
        (bookings) => {
          console.log('Updated dataBookings:', bookings);
          this.dataBookings = bookings;
          this.filterBookingsByRoom(
            { id: this.selectedRoom.id || null, name: this.selectedRoom.name || 'Semua Jadwal Ruangan Meeting' },
            false
          );
        },
        (error) => {
          console.error('Error updating dataBookings:', error);
        }
      );

    // Fetch dataRooms once on component initialization
    this.apiService.getDataRooms().subscribe(
      (response) => {
        this.dataRooms = response;
        this.applyInitialRoomSelection();
      },
      (error) => {
        console.error('Error fetching dataRooms:', error);
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper method for initial fetch
  private fetchBookings(): void {
    this.apiService.getDataBookings().subscribe(
      (bookings) => {
        console.log('Initial dataBookings:', bookings);
        this.dataBookings = bookings;
        if (this.selectedRoom.id !== null) {
          this.filterBookingsByRoom(this.selectedRoom, false);
        } else {
          this.filterBookingsByRoom({ id: null, name: 'Semua Jadwal Ruangan Meeting' }, false); // Show all bookings by default
        }
      },
      (error) => {
        console.error('Error fetching initial dataBookings:', error);
      }
    );
  }

  private applyInitialRoomSelection(): void {
    if (!this.initialRoomId || !Array.isArray(this.dataRooms)) {
      return;
    }

    const roomFromQuery = this.dataRooms.find((room: any) => room.id === this.initialRoomId);
    if (roomFromQuery) {
      this.filterBookingsByRoom(roomFromQuery, false);
    }
  }

  formatTime(time: string): string {
    // Split by 'T' and take the time part, then split by ':' and take HH:mm
    return time.split('T')[1]?.split(':').slice(0, 2).join(':') || time;
  }

  private matchesSelectedRoom(schedule: any, roomId: number | null): boolean {
    if (roomId === null || roomId === undefined) {
      return true;
    }

    const scheduleRoomId = schedule?.room_id ?? schedule?.room?.id;
    if (scheduleRoomId === null || scheduleRoomId === undefined) {
      return false;
    }

    return Number(scheduleRoomId) === Number(roomId);
  }

  private isApprovedSchedule(schedule: any): boolean {
    const allowedStatuses = ['approved', 'on_going'];
    const status = String(schedule?.status ?? '').toLowerCase();
    return allowedStatuses.includes(status);
  }

  private sortByStartTimeAscending(schedules: any[]): any[] {
    return [...schedules].sort((a: any, b: any) => {
      const aTime = new Date(a?.start_time).getTime();
      const bTime = new Date(b?.start_time).getTime();

      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return String(a?.start_time ?? '').localeCompare(String(b?.start_time ?? ''));
      }

      return aTime - bTime;
    });
  }

  private prepareDisplayBookings(bookings: any[], roomId: number | null): any[] {
    return bookings
      .map((monthGroup: any) => ({
        ...monthGroup,
        dates: monthGroup.dates
          .map((dateGroup: any) => {
            const approvedSchedules = dateGroup.schedules
              .filter((schedule: any) => this.isApprovedSchedule(schedule))
              .filter((schedule: any) => this.matchesSelectedRoom(schedule, roomId));

            return {
              ...dateGroup,
              schedules: this.sortByStartTimeAscending(approvedSchedules)
            };
          })
          .filter((dateGroup: any) => dateGroup.schedules.length > 0),
      }))
      .filter((monthGroup: any) => monthGroup.dates.length > 0);
  }

  // Method to filter bookings by room name
  filterBookingsByRoom(room: any, updateUrl: boolean = true): void {
    this.selectedRoom = room;
    console.log('selectedRoom name : ' + this.selectedRoom.name);
    console.log('selectedRoom id : ' + this.selectedRoom.id);

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { roomId: room?.id ?? null },
        queryParamsHandling: 'merge'
      });
    }

    if (!this.dataBookings) {
      this.filteredBookings = [];
      return;
    }

    if (this.selectedRoom.name === 'Semua Jadwal Ruangan Meeting') {
      // Show all bookings if "Semua Jadwal Ruangan Meeting" is selected
      this.filteredBookings = this.prepareDisplayBookings(this.dataBookings, null);
    } else {
      // Flatten and filter schedules by selected room
      // Process the nested structure (grouped by month and date)
      this.filteredBookings = this.prepareDisplayBookings(this.dataBookings, room.id ?? null);
    }
  }

  // Open modal and pass selected booking data
  openVerificationModal(booking: any) {
    const dialogRef = this.dialog.open(CancelModalComponent, {
      width: '400px',
      data: {
        id: booking.id,
        bookingEmail: booking.email, // Pass the email from the selected booking
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
        console.log('Email verified successfully');
      } else {
        console.log('Verification cancelled');
      }
    });
  }
}

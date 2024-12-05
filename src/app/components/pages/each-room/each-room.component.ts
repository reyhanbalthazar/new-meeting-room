import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-each-room',
  templateUrl: './each-room.component.html',
  styleUrls: ['./each-room.component.css'],
})
export class EachRoomComponent implements OnInit {
  dataRooms: any[] = []; // Holds room data
  dataBookings: any[] = []; // Holds all bookings
  filteredBookings: any[] = []; // Filtered bookings for the selected room
  selectedRoom: string | null = null; // Currently selected room ID
  selectedRoomName: string = ''; // Selected room name

  constructor(private apiService: ApiService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Fetch rooms and bookings
    this.fetchRooms();
    this.fetchBookings();

    // Check if a room ID is passed in the route
    const roomId = this.route.snapshot.paramMap.get('id');
    console.log('Captured roomId:', roomId); // Debug log
    if (roomId) {
      this.selectedRoom = roomId;

      // Wait until dataRooms is fetched
      const interval = setInterval(() => {
        if (this.dataRooms && this.dataRooms.length > 0) {
          this.setRoomName(roomId); // Fetch the room name based on roomId
          clearInterval(interval); // Stop polling
        }
      }, 100);
    }
  }


  fetchRooms(): void {
    this.apiService.getDataRooms().subscribe(
      (rooms) => {
        console.log('Rooms Data:', rooms); // Debug log
        this.dataRooms = rooms;
      },
      (error) => {
        console.error('Error fetching rooms:', error);
      }
    );
  }

  fetchBookings(): void {
    this.apiService.getDataBookings().subscribe(
      (bookings) => {
        console.log('Bookings Data:', bookings); // Debug log
        this.dataBookings = bookings;
        if (this.selectedRoom) {
          this.filterBookingsByRoomId(this.selectedRoom);
        }
      },
      (error) => {
        console.error('Error fetching bookings:', error);
      }
    );
  }

  setRoomName(roomId: string): void {
    if (!this.dataRooms || this.dataRooms.length === 0) {
      console.error('Rooms data is not yet loaded.');
      this.selectedRoomName = 'Room not found';
      return;
    }
    console.log('this.dataRooms:', this.dataRooms);
    const room = this.dataRooms.find((room) => room.id == roomId); // Match roomId with the correct field in dataRooms
    if (room) {
      this.selectedRoomName = room.name; // Set the selected room name
      console.log('Selected Room Name:', this.selectedRoomName);
    } else {
      this.selectedRoomName = 'Room not found'; // Default if room not found
      console.log('Selected Room Name:', this.selectedRoomName);
    }
  }

  filterBookingsByRoomId(roomId: string | null): void {
    if (!roomId) {
      this.filteredBookings = []; // Reset filteredBookings if no room is selected
      return;
    }

    // Log all bookings before filtering
    console.log('All bookings:', this.dataBookings);

    // Perform filtering
    this.filteredBookings = this.dataBookings.filter((booking) =>
      booking.schedules.some((schedule: any) => schedule.room_id == roomId)
    );

    // Log the result
    console.log('Filtered bookings:', this.filteredBookings);
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }
}

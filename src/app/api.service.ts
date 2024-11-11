import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class ApiService {

  private apiUrlBookings = environment.apiUrl + '/bookings';
  private apiUrlRooms = environment.apiUrl + '/rooms';

  constructor(private http: HttpClient) { }

  getDataBookings(): Observable<any> {
    return this.http.get<any>(this.apiUrlBookings);
  }

  getDataRooms(): Observable<any> {
    return this.http.get<any>(this.apiUrlRooms);
  }

}

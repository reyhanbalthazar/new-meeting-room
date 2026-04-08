import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isHomePage: boolean = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Check if the current route is the Home page
    this.isHomePage = this.router.url === '/';

    // Listen for route changes
    this.router.events.subscribe(() => {
      this.isHomePage = this.router.url === '/';
    });
  }

  navigateToBookingForm(): void {
    const currentQueryParams = this.router.parseUrl(this.router.url).queryParams;
    const roomId = currentQueryParams['roomId'];

    this.router.navigate(['/form-booking'], {
      queryParams: roomId ? { roomId } : {}
    });
  }
}

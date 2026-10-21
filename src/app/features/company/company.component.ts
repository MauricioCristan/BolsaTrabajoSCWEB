import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-company',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class CompanyComponent {}

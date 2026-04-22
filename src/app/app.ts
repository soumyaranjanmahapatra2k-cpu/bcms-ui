import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; }']
})
export class App implements OnInit {
  private themeService = inject(ThemeService);
  ngOnInit() { this.themeService.init(); }
}

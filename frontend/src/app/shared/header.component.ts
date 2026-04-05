import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="main-header">
      <img src="assets/quicare-logo.png" alt="QuiCare Logo" class="main-logo" />
    </header>
  `,
  styles: [`
    .main-header {
      width: 100%;
      background: #f8fbfd;
      padding: 18px 32px 8px 32px;
      display: flex;
      align-items: flex-end;
      border-bottom: 1px solid #e6eef7;
      min-height: 80px;
    }
    .main-logo {
      height: 54px;
      width: auto;
      display: block;
    }
  `]
})
export class HeaderComponent {}

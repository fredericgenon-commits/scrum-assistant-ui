import { Component, signal, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav mode="side" opened class="app-sidenav">
        <div class="sidenav-header">
          <div class="logo">
            <div class="logo-mark">S</div>
            <div class="logo-text">
              <span class="logo-title">Scrum Assistant</span>
            </div>
          </div>
        </div>

        <mat-nav-list class="nav-links">
          <a mat-list-item routerLink="/reports" routerLinkActive="active-link">
            <mat-icon matListItemIcon>bar_chart</mat-icon>
            <span matListItemTitle>Reports</span>
          </a>
          <a mat-list-item routerLink="/teams" routerLinkActive="active-link">
            <mat-icon matListItemIcon>groups</mat-icon>
            <span matListItemTitle>Teams</span>
          </a>
          <a mat-list-item routerLink="/developers" routerLinkActive="active-link">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>Developers</span>
          </a>
          <a mat-list-item routerLink="/sprints" routerLinkActive="active-link">
            <mat-icon matListItemIcon>event</mat-icon>
            <span matListItemTitle>Sprints</span>
          </a>
        </mat-nav-list>

        <div class="sidenav-footer">
          <button mat-icon-button
                  class="theme-toggle"
                  (click)="toggleTheme()"
                  [matTooltip]="isDark() ? 'Light mode' : 'Dark mode'">
            <mat-icon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          <span class="version">v0.1.0</span>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="app-content">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container {
      height: 100vh;
    }

    .app-sidenav {
      width: 240px;
      background: var(--color-sidebar-bg);
      border-right: 1px solid var(--color-sidebar-border, rgba(0,0,0,0.08));
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      padding: 28px 20px 24px;
      border-bottom: 1px solid var(--color-sidebar-border, rgba(0,0,0,0.08));
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-mark {
      width: 36px;
      height: 36px;
      background: var(--color-gold, #8F7237);
      color: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      letter-spacing: -0.02em;
    }

    .logo-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-heading, #1a1a1a);
      letter-spacing: -0.01em;
    }

    .nav-links {
      padding: 16px 0;
      flex: 1;

      a[mat-list-item] {
        color: var(--color-sidebar-text);
        margin: 1px 8px;
        border-radius: 4px;
        height: 44px;
        font-size: 14px;
        letter-spacing: 0;
        transition: all 0.15s;

        mat-icon {
          color: var(--color-sidebar-icon, #9a9590);
          font-size: 20px;
          width: 20px;
          height: 20px;
          transition: color 0.15s;
        }

        &:hover {
          background: var(--color-sidebar-hover-bg, rgba(0,0,0,0.04));
          color: var(--color-text-heading, #1a1a1a);
          mat-icon { color: var(--color-gold, #8F7237); }
        }

        &.active-link {
          background: rgba(143,114,55,0.12);
          color: var(--color-sidebar-active);
          font-weight: 500;
          mat-icon { color: var(--color-sidebar-active); }
        }
      }
    }

    .sidenav-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--color-sidebar-border, rgba(0,0,0,0.08));
      display: flex;
      align-items: center;
      justify-content: space-between;

      .theme-toggle {
        color: var(--color-sidebar-icon, #9a9590);
        transition: color 0.2s;
        &:hover { color: var(--color-gold, #8F7237); }
        mat-icon { font-size: 20px; width: 20px; height: 20px; }
      }

      .version {
        color: var(--color-text-light, #7a7670);
        font-size: 11px;
        font-weight: 500;
        opacity: 0.6;
      }
    }

    .app-content {
      background: var(--color-bg);
      transition: background-color 0.3s;
    }
  `]
})
export class AppComponent {
  isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem('sa-theme');
    if (saved === 'dark') this.isDark.set(true);

    effect(() => {
      const theme = this.isDark() ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('sa-theme', theme);
    });
  }

  toggleTheme() {
    this.isDark.update(v => !v);
  }
}

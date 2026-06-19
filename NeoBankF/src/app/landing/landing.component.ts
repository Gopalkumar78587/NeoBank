import { Component, HostListener, OnInit, AfterViewInit, OnDestroy, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  isScrolled = false;
  mobileMenu = false;
  scrollProgress = 0;
  year = new Date().getFullYear();

  private revealObserver?: IntersectionObserver;
  private isBrowser: boolean;

  constructor(
    private host: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) this.updateScroll();
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this.revealObserver?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    this.host.nativeElement
      .querySelectorAll('[data-reveal]')
      .forEach((el) => this.revealObserver!.observe(el));
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isBrowser) this.updateScroll();
  }

  private updateScroll(): void {
    const y = window.scrollY;
    this.isScrolled = y > 60;
    const doc = document.documentElement;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    this.scrollProgress = Math.min(100, Math.max(0, (y / max) * 100));
  }
}

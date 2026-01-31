import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[fadeInAnimation]',
  standalone: true
})
export class FadeInAnimationDirective implements OnInit, OnDestroy {
  @Input() animationDelay: number = 0;
  @Input() animationType: 'fade' | 'slideUp' | 'scale' | 'slideLeft' = 'fade';
  @Input() staggerDelay: number = 0;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.setupInitialState();
    this.startAnimation();
  }

  ngOnDestroy() {
    // Clean up any ongoing animations
    if (this.el.nativeElement) {
      this.el.nativeElement.style.transition = '';
    }
  }

  private setupInitialState() {
    const element = this.el.nativeElement;
    
    // Set initial state based on animation type
    switch (this.animationType) {
      case 'fade':
        element.style.opacity = '0';
        break;
      case 'slideUp':
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        break;
      case 'scale':
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        break;
      case 'slideLeft':
        element.style.opacity = '0';
        element.style.transform = 'translateX(-20px)';
        break;
    }
    
    // Set transition properties
    element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  private startAnimation() {
    const element = this.el.nativeElement;
    const totalDelay = this.animationDelay + this.staggerDelay;
    
    setTimeout(() => {
      // Animate to final state
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) translateX(0) scale(1)';
      
      // Clean up transition after animation completes
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    }, totalDelay);
  }
}
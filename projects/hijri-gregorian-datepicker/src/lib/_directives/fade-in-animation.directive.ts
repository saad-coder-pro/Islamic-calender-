import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[fadeInAnimation]',
  standalone: true
})
export class FadeInAnimationDirective implements OnInit, OnDestroy {
  @Input() fadeInAnimation: boolean = true; // Controls whether animations should run
  @Input() animationDelay: number = 0;
  @Input() animationType: 'fade' | 'slideUp' | 'scale' | 'slideLeft' = 'fade';
  @Input() staggerDelay: number = 0;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    if (this.fadeInAnimation) {
      this.setupInitialState();
      this.startAnimation();
    }
  }

  ngOnDestroy() {
    if (this.el.nativeElement) {
      this.el.nativeElement.style.transition = '';
    }
  }

  private setupInitialState() {
    const element = this.el.nativeElement;
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
    
    element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  private startAnimation() {
    const element = this.el.nativeElement;
    const totalDelay = this.animationDelay + this.staggerDelay;
    
    setTimeout(() => {

      element.style.opacity = '1';
      element.style.transform = 'translateY(0) translateX(0) scale(1)';
      
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    }, totalDelay);
  }
}
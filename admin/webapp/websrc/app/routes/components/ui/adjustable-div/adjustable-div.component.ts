import {
  Component,
  ContentChild,
  Directive,
  Input,
  OnDestroy,
  Renderer2,
  TemplateRef,
} from '@angular/core';

interface ContainerOneHeightContext {
  $implicit: number;
}

interface ContainerTwoHeightContext {
  $implicit: number;
}

@Directive({
  selector: '[appContainerOne]',
})
export class ContainerOneDirective {
  constructor(readonly tpl: TemplateRef<ContainerOneHeightContext>) {}
}

@Directive({
  selector: '[appContainerTwo]',
})
export class ContainerTwoDirective {
  constructor(readonly tpl: TemplateRef<ContainerTwoHeightContext>) {}
}

@Component({
  selector: 'app-adjustable-div',
  templateUrl: './adjustable-div.component.html',
  styleUrls: ['./adjustable-div.component.scss'],
})
export class AdjustableDivComponent implements OnDestroy {
  @ContentChild(ContainerOneDirective, { static: true })
  containerOneDir!: ContainerOneDirective;
  @ContentChild(ContainerTwoDirective, { static: true })
  containerTwoDir!: ContainerTwoDirective;

  @Input() minHeightOne;
  @Input() minHeightTwo;
  @Input() roof = 157.4 - 40;
  unknownScale = 75.6;
  gridHeight = window.innerHeight - this.roof - this.unknownScale;
  heightOne = this.gridHeight / 2;
  heightTwo = this.gridHeight / 2;
  mousemoveListener;
  mouseupListener;

  constructor(private renderer2: Renderer2) {}

  get containerOneTpl(): TemplateRef<ContainerOneHeightContext> {
    return this.containerOneDir.tpl;
  }

  get containerTwoTpl(): TemplateRef<ContainerTwoHeightContext> {
    return this.containerTwoDir.tpl;
  }

  get containerOneHeightContext(): ContainerOneHeightContext {
    return { $implicit: this.heightOne };
  }

  get containerTwoHeightContext(): ContainerOneHeightContext {
    return { $implicit: this.heightTwo };
  }

  onResize(): void {
    const ratioOne = this.heightOne / this.gridHeight;
    const ratioTwo = this.heightTwo / this.gridHeight;
    this.gridHeight = window.innerHeight - this.roof - this.unknownScale;
    if (
      this.gridHeight * ratioOne < this.minHeightOne &&
      this.gridHeight * ratioTwo < this.minHeightTwo
    ) {
      this.heightOne = this.minHeightOne;
      this.heightTwo = this.minHeightTwo;
    } else if (this.gridHeight * ratioOne < this.minHeightOne) {
      this.heightOne = this.minHeightOne;
      this.heightTwo = this.gridHeight - this.heightOne;
    } else if (this.gridHeight * ratioTwo < this.minHeightTwo) {
      this.heightTwo = this.minHeightTwo;
      this.heightOne = this.gridHeight - this.heightTwo;
    } else {
      const resize =
        this.minHeightOne + this.minHeightTwo + this.roof + this.unknownScale;
      if (
        window.innerHeight > resize &&
        this.heightOne + this.heightTwo > this.gridHeight + this.unknownScale
      ) {
        this.heightOne = this.gridHeight / 2;
        this.heightTwo = this.gridHeight / 2;
      } else {
        this.heightOne = this.gridHeight * ratioOne;
        this.heightTwo = this.gridHeight * ratioTwo;
      }
    }
  }

  startResize(): void {
    this.mousemoveListener = this.renderer2.listen(
      'document',
      'mousemove',
      event => {
        if (
          event.pageY > this.roof + this.minHeightOne &&
          event.pageY <
            window.innerHeight - this.minHeightTwo - this.unknownScale
        ) {
          this.heightOne = event.pageY - this.minHeightOne;
          this.heightTwo = this.gridHeight - this.heightOne;
        } else if (event.pageY < this.roof + this.minHeightOne) {
          this.heightOne = this.minHeightOne;
          this.heightTwo = this.gridHeight - this.heightOne;
        } else {
          this.heightTwo = this.minHeightTwo;
          this.heightOne = this.gridHeight - this.heightTwo;
        }
      }
    );
    this.mouseupListener = this.renderer2.listen(
      'document',
      'mouseup',
      event => {
        this.mousemoveListener();
      }
    );
  }

  ngOnDestroy(): void {
    this.mousemoveListener = undefined;
    this.mouseupListener = undefined;
  }
}

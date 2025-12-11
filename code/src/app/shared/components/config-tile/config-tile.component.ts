import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfigOption {
  value: any;
  label: string;
  description?: string;
}

export type ConfigInputType = 'select' | 'stepper';

@Component({
  selector: 'app-config-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './config-tile.component.html',
  styleUrls: ['./config-tile.component.css']
})
export class ConfigTileComponent {
  @Input() label: string = '';
  @Input() currentValue: any;
  @Input() options: ConfigOption[] = [];
  @Input() inputType: ConfigInputType = 'select';
  @Input() min: number = 1;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() suffix: string = '';
  @Input() isExpanded: boolean = false;
  @Output() valueChange = new EventEmitter<any>();
  @Output() toggleExpand = new EventEmitter<void>();

  selectOption(value: any): void {
    this.valueChange.emit(value);
    if (this.inputType === 'select') {
      this.toggleExpand.emit();
    }
  }

  onTileClick(): void {
    if (this.inputType === 'select') {
      this.toggleExpand.emit();
    }
  }

  increment(): void {
    const newValue = Number(this.currentValue) + this.step;
    if (newValue <= this.max) {
      this.valueChange.emit(newValue);
    }
  }

  decrement(): void {
    const newValue = Number(this.currentValue) - this.step;
    if (newValue >= this.min) {
      this.valueChange.emit(newValue);
    }
  }

  canIncrement(): boolean {
    return Number(this.currentValue) < this.max;
  }

  canDecrement(): boolean {
    return Number(this.currentValue) > this.min;
  }

  getCurrentLabel(): string {
    if (this.inputType === 'stepper') {
      return `${this.currentValue}${this.suffix}`;
    }
    const option = this.options.find(opt => opt.value === this.currentValue);
    return option?.label || String(this.currentValue);
  }
}


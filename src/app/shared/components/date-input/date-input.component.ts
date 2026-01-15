import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true
    }
  ]
})
export class DateInputComponent implements ControlValueAccessor, OnInit {
  @Input() minDate: string = '';
  @Input() maxDate: string = '';
  @Input() placeholder: string = 'dd/mm/yyyy';
  @Input() required: boolean = false;
  @Input() id: string = '';
  @Input() label: string = '';
  @Input() errorMessage: string = '';

  dateControl = new FormControl('');
  displayValue: string = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.dateControl.valueChanges.subscribe(value => {
      if (value) {
        const formatted = this.formatInput(value);
        if (formatted !== value) {
          this.dateControl.setValue(formatted, { emitEvent: false });
        }
        this.displayValue = formatted;
        const isoDate = this.parseToISO(formatted);
        if (isoDate && this.isValidDate(formatted)) {
          this.onChange(isoDate);
        } else {
          this.onChange('');
        }
      } else {
        this.displayValue = '';
        this.onChange('');
      }
    });
  }

  writeValue(value: string): void {
    if (value) {
      const formatted = this.formatDisplay(value);
      this.displayValue = formatted;
      this.dateControl.setValue(formatted, { emitEvent: false });
    } else {
      this.displayValue = '';
      this.dateControl.setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.dateControl.disable();
    } else {
      this.dateControl.enable();
    }
  }

  onBlur() {
    this.onTouched();
    const value = this.dateControl.value || '';
    if (value && this.isValidDate(value)) {
      const formatted = this.formatDisplay(value);
      this.dateControl.setValue(formatted, { emitEvent: false });
      this.displayValue = formatted;
    }
  }

  private formatInput(value: string): string {
    // Remover todo excepto números
    const numbers = value.replace(/\D/g, '');
    
    // Aplicar formato dd/mm/yyyy
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  }

  private formatDisplay(value: string): string {
    if (!value) return '';
    
    // Si viene en formato ISO (YYYY-MM-DD)
    if (value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    
    // Si ya está en formato dd/mm/yyyy
    if (value.includes('/')) {
      return value;
    }
    
    return value;
  }

  private parseToISO(value: string): string {
    if (!value) return '';
    
    // Convertir dd/mm/yyyy a YYYY-MM-DD
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        if (this.isValidDate(value)) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    return '';
  }

  private isValidDate(value: string): boolean {
    if (!value.includes('/')) return false;
    const parts = value.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;
    
    const date = new Date(year, month - 1, day);
    const isValid = date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
    
    // Validar minDate si existe
    if (isValid && this.minDate) {
      const minDateStr = this.minDate.includes('T') ? this.minDate.split('T')[0] : this.minDate;
      const minDateParts = minDateStr.split('-');
      if (minDateParts.length === 3) {
        const minDateObj = new Date(parseInt(minDateParts[0]), parseInt(minDateParts[1]) - 1, parseInt(minDateParts[2]));
        minDateObj.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        if (date < minDateObj) return false;
      }
    }
    
    // Validar maxDate si existe
    if (isValid && this.maxDate) {
      const maxDateStr = this.maxDate.includes('T') ? this.maxDate.split('T')[0] : this.maxDate;
      const maxDateParts = maxDateStr.split('-');
      if (maxDateParts.length === 3) {
        const maxDateObj = new Date(parseInt(maxDateParts[0]), parseInt(maxDateParts[1]) - 1, parseInt(maxDateParts[2]));
        maxDateObj.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        if (date > maxDateObj) return false;
      }
    }
    
    return isValid;
  }

  get isInvalid(): boolean {
    const value = this.dateControl.value || '';
    return value.length > 0 && !this.isValidDate(value);
  }
}

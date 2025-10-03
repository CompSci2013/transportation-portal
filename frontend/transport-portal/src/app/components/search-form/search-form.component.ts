import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { SearchFilters } from '../../models';

@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss']
})
export class SearchFormComponent implements OnInit, OnChanges {
  @Input() initialFilters: SearchFilters = {};
  @Input() loading: boolean = false;
  
  @Output() search = new EventEmitter<SearchFilters>();
  @Output() reset = new EventEmitter<void>();
  
  searchForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      manufacturer: [''],
      model: [''],
      yearMin: [null, [Validators.min(1900), Validators.max(new Date().getFullYear())]],
      yearMax: [null, [Validators.min(1900), Validators.max(new Date().getFullYear())]],
      state: ['', [Validators.maxLength(2), Validators.pattern(/^[A-Z]{0,2}$/)]]
    }, { validators: this.yearRangeValidator });
  }

  ngOnInit(): void {
    this.hydrateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilters'] && !changes['initialFilters'].firstChange) {
      this.hydrateForm();
    }
  }

  private hydrateForm(): void {
    if (this.initialFilters) {
      this.searchForm.patchValue({
        manufacturer: this.initialFilters.manufacturer || '',
        model: this.initialFilters.model || '',
        yearMin: this.initialFilters.yearMin || null,
        yearMax: this.initialFilters.yearMax || null,
        state: this.initialFilters.state || ''
      }, { emitEvent: false });
    }
  }

  /**
   * Custom validator: yearMax must be >= yearMin
   */
  private yearRangeValidator(control: AbstractControl): ValidationErrors | null {
    const yearMin = control.get('yearMin')?.value;
    const yearMax = control.get('yearMax')?.value;
    
    if (yearMin && yearMax && yearMax < yearMin) {
      return { yearRangeInvalid: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }
    
    const formValue = this.searchForm.value;
    
    // Remove empty/null values
    const filters: SearchFilters = {};
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== '' && value !== undefined) {
        filters[key as keyof SearchFilters] = value;
      }
    });
    
    this.search.emit(filters);
  }

  onReset(): void {
    this.searchForm.reset();
    this.reset.emit();
  }

  get formValues(): SearchFilters {
    return this.searchForm.value;
  }

  // Validation error helpers for template
  get yearMinErrors(): string | null {
    const control = this.searchForm.get('yearMin');
    if (control?.touched) {
      if (control.hasError('min')) return 'Year must be 1900 or later';
      if (control.hasError('max')) return 'Year cannot be in the future';
    }
    return null;
  }

  get yearMaxErrors(): string | null {
    const control = this.searchForm.get('yearMax');
    if (control?.touched) {
      if (control.hasError('min')) return 'Year must be 1900 or later';
      if (control.hasError('max')) return 'Year cannot be in the future';
    }
    return null;
  }

  get yearRangeError(): string | null {
    if (this.searchForm.hasError('yearRangeInvalid') && 
        (this.searchForm.get('yearMin')?.touched || this.searchForm.get('yearMax')?.touched)) {
      return 'Year To must be greater than or equal to Year From';
    }
    return null;
  }

  get stateErrors(): string | null {
    const control = this.searchForm.get('state');
    if (control?.touched) {
      if (control.hasError('pattern')) return 'State must be 2 uppercase letters (e.g., CA, TX)';
      if (control.hasError('maxLength')) return 'State code must be 2 letters';
    }
    return null;
  }
}

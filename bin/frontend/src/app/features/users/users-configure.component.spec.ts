import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersConfigureComponent } from './users-configure.component';

describe('UsersConfigureComponent', () => {
  let component: UsersConfigureComponent;
  let fixture: ComponentFixture<UsersConfigureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersConfigureComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(UsersConfigureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

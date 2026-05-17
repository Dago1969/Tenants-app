import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';

interface NurseIdentityDto {
  id: number;
  username?: string | null;
  userid?: string | null;
  email?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CurrentNurseService {
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  resolveCurrentNurseId(): Observable<number | null> {
    const storedNurseId = localStorage.getItem('nurseId');
    if (storedNurseId) {
      const parsedId = Number.parseInt(storedNurseId, 10);
      if (!Number.isNaN(parsedId)) {
        return of(parsedId);
      }
    }

    const userIdentifiers = this.authService.getCurrentUserIdentifiers();
    if (userIdentifiers.length === 0) {
      return of(null);
    }

    return this.http.get<NurseIdentityDto[]>(`${environment.apiBaseUrl}/nurses`).pipe(
      map((nurses) => this.findMatchingNurseId(nurses, userIdentifiers)),
      map((nurseId) => {
        if (nurseId !== null) {
          localStorage.setItem('nurseId', nurseId.toString());
        }
        return nurseId;
      }),
      catchError(() => of(null))
    );
  }

  private findMatchingNurseId(nurses: NurseIdentityDto[], userIdentifiers: string[]): number | null {
    const normalizedIdentifiers = new Set(userIdentifiers.map((value) => this.normalize(value)).filter((value): value is string => value !== null));

    const match = nurses.find((nurse) => {
      const candidates = [nurse.username, nurse.userid, nurse.email]
        .map((value) => this.normalize(value))
        .filter((value): value is string => value !== null);

      return candidates.some((value) => normalizedIdentifiers.has(value));
    });

    return match?.id ?? null;
  }

  private normalize(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }
}
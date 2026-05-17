# Implementazione Step Caricamento Immagini - Guida Completamento

## Stato Implementazione

✅ **Backend (100% completato)**
- Entity, Repository, Service, Controller, DTO, Mapper, Changelog Liquibase
- Compilazione: BUILD SUCCESS

⚠️ **Frontend (Parzialmente completato)**
- Proprietà TypeScript aggiunte
- Manca: HTML template e metodi handler

---

## Step per Completare il Frontend

### 1. Aggiungere Metodi TypeScript nel Component

Nel file `therapeutic-plan-manage.component.ts`, aggiungere i seguenti metodi:

```typescript
/**
 * Carica un'immagine per la visita corrente
 */
onVisitImageFileSelected(event: any): void {
  const file = event.target.files[0];
  if (!file) return;
  
  this.visitImageUploading = true;
  this.visitImageErrorMessage = '';
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', this.visitImageDescriptionForm);
  
  const visitDate = this.visitForm.date; // ISO datetime string
  const url = `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/visits/${visitDate}/images`;
  
  this.http.post<any>(url, formData)
    .pipe(catchError((error) => {
      this.visitImageErrorMessage = 'Errore durante il caricamento dell\'immagine: ' + error.error?.detail || error.message;
      return of(null);
    }))
    .subscribe((result) => {
      this.visitImageUploading = false;
      if (result) {
        this.visitImageEntries.push({
          id: result.id,
          imageName: result.imageName,
          imageType: result.imageType,
          description: result.description || '',
          uploadDate: result.uploadDate
        });
        this.visitImageDescriptionForm = '';
        // Reset file input
        const fileInput = document.getElementById('visitImageInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    });
}

/**
 * Elimina un'immagine dalla visita
 */
deleteVisitImage(imageId: number): void {
  if (!confirm(this.translate('therapeuticPlan.visits.images.confirmDelete'))) {
    return;
  }
  
  const visitDate = this.visitForm.date;
  const url = `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/visits/${visitDate}/images/${imageId}`;
  
  this.http.delete(url)
    .pipe(catchError((error) => {
      this.visitImageErrorMessage = 'Errore durante l\'eliminazione dell\'immagine';
      return of(null);
    }))
    .subscribe(() => {
      this.visitImageEntries = this.visitImageEntries.filter(img => img.id !== imageId);
    });
}

/**
 * Scarica un'immagine
 */
downloadVisitImage(imageId: number, imageName: string): void {
  const visitDate = this.visitForm.date;
  const url = `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/visits/${visitDate}/images/${imageId}/download`;
  window.open(url, '_blank');
}

/**
 * Carica le immagini per la visita corrente
 */
private loadVisitImages(): void {
  if (!this.planId || !this.visitForm.date) {
    this.visitImageEntries = [];
    return;
  }
  
  const visitDate = this.visitForm.date;
  const url = `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/visits/${visitDate}/images`;
  
  this.http.get<any[]>(url)
    .pipe(catchError(() => of([])))
    .subscribe((images) => {
      this.visitImageEntries = (images || []).map(img => ({
        id: img.id,
        imageName: img.imageName,
        imageType: img.imageType,
        description: img.description || '',
        uploadDate: img.uploadDate
      }));
    });
}
```

### 2. Aggiungere Template HTML nel Modal Visite

Nel file `therapeutic-plan-manage.component.html`, nella sezione del `qtm-step-modal` per le visite, **aggiungere uno nuovo step alla fine** (dopo l'autonomy step, che è il step 7 nel layout legacy):

```html
<!-- Step delle Immagini - Ultimo step del wizard -->
<section *ngIf="visitModalStep === (useLegacyVisitSchemaLayout ? 8 : 3)" class="visit-images-step-shell">
  <article class="visit-status-panel visit-status-panel-wide">
    <header class="visit-status-panel-header">
      {{ translate('therapeuticPlan.visits.images.title') }}
    </header>
    <div class="visit-status-panel-body">
      <p class="section-copy">{{ translate('therapeuticPlan.visits.images.description') }}</p>
      
      <div *ngIf="visitImageErrorMessage" class="therapeutic-plan-alert therapeutic-plan-alert-error">
        {{ visitImageErrorMessage }}
      </div>

      <!-- Form caricamento immagine -->
      <div class="visit-images-upload-section">
        <label class="alert-modal-field alert-modal-field-full">
          {{ translate('therapeuticPlan.visits.images.selectFile') }}
          <input 
            type="file" 
            id="visitImageInput"
            accept="image/*"
            (change)="onVisitImageFileSelected($event)"
            [disabled]="visitImageUploading"
          />
        </label>

        <label class="alert-modal-field alert-modal-field-full">
          {{ translate('therapeuticPlan.visits.images.description') }}
          <textarea 
            [(ngModel)]="visitImageDescriptionForm" 
            rows="3"
            maxlength="500"
            [disabled]="visitImageUploading"
          ></textarea>
        </label>

        <button 
          type="button"
          class="therapeutic-plan-btn therapeutic-plan-btn-primary"
          [disabled]="visitImageUploading"
          (click)="document.getElementById('visitImageInput').click()"
        >
          {{ translate('therapeuticPlan.visits.images.upload') }}
        </button>
      </div>

      <!-- Lista immagini caricate -->
      <div *ngIf="visitImageEntries.length > 0; else noImagesState" class="visit-images-list">
        <h3>{{ translate('therapeuticPlan.visits.images.uploadedCount', { count: visitImageEntries.length }) }}</h3>
        <div class="visit-images-grid">
          <div *ngFor="let image of visitImageEntries" class="visit-image-card">
            <div class="visit-image-preview">
              <img [src]="'data:' + image.imageType + ';base64,...'" alt="Preview" />
            </div>
            <div class="visit-image-info">
              <strong>{{ image.imageName }}</strong>
              <p *ngIf="image.description" class="visit-image-description">{{ image.description }}</p>
              <span class="visit-image-date">{{ formatDate(image.uploadDate) }}</span>
            </div>
            <div class="visit-image-actions">
              <button 
                type="button"
                class="icon-btn"
                [attr.title]="translate('common.download')"
                (click)="downloadVisitImage(image.id, image.imageName)"
              >
                <span class="icon">⬇️</span>
              </button>
              <button 
                type="button"
                class="icon-btn icon-btn-danger"
                [attr.title]="translate('common.delete')"
                (click)="deleteVisitImage(image.id)"
              >
                <span class="icon">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noImagesState>
        <p class="empty-state">{{ translate('therapeuticPlan.visits.images.empty') }}</p>
      </ng-template>
    </div>
  </article>
</section>
```

### 3. Aggiungere Chiavi di Traduzione

Nel file properties del frontend (`frontend/public/i18n/messages.properties`), aggiungere:

```properties
therapeuticPlan.visits.images.title=Immagini Visita
therapeuticPlan.visits.images.description=Carica immagini relative alla visita
therapeuticPlan.visits.images.selectFile=Seleziona file immagine
therapeuticPlan.visits.images.description=Descrizione (opzionale)
therapeuticPlan.visits.images.upload=Carica Immagine
therapeuticPlan.visits.images.uploadedCount=Immagini caricate ({count})
therapeuticPlan.visits.images.empty=Nessuna immagine caricata
therapeuticPlan.visits.images.confirmDelete=Sei sicuro di voler eliminare questa immagine?
```

### 4. Aggiornare Logica Step del Wizard

Modificare i getter per `visitModalTotalSteps` e `isLastVisitModalStep` per includere il nuovo step delle immagini:

```typescript
get visitModalTotalSteps(): number {
  if (!this.hasVisitProjectJsonSchema) {
    return 3; // Step 1: Base, Step 2: Manual JSON, Step 3: Images
  }
  return this.useLegacyVisitSchemaLayout ? 8 : 3; // Step 8 (legacy) o 3 (new) aggiunge images
}

get isLastVisitModalStep(): boolean {
  return this.visitModalStep === this.visitModalTotalSteps;
}
```

### 5. Aggiungere Caricamento Immagini quando Cambio Data Visita

Nel metodo `onVisitDateChange()`, aggiungere:

```typescript
onVisitDateChange(value: string): void {
  this.visitForm.date = value;
  this.loadVisitImages(); // Carica immagini per la nuova data
}
```

---

## Endpoint API Disponibili

```
POST   /api/tenants/therapeutic-plans/{planId}/visits/{visitDate}/images
       Request: multipart/form-data con 'file' e opzionalmente 'description'
       Response: { id, imageName, imageType, description, uploadDate }

GET    /api/tenants/therapeutic-plans/{planId}/visits/{visitDate}/images
       Response: Array di { id, imageName, imageType, description, uploadDate }

GET    /api/tenants/therapeutic-plans/{planId}/visits/{visitDate}/images/{imageId}/download
       Response: Binary image data

DELETE /api/tenants/therapeutic-plans/{planId}/visits/{visitDate}/images/{imageId}
```

---

## Note Importanti

1. La data della visita nel percorso URL deve essere in formato ISO 8601 (YYYY-MM-DDTHH:mm:ss)
2. Le immagini sono salvate come LONGBLOB nel database
3. Il endpoint di download restituisce l'immagine con il content-type corretto
4. Aggiungere i metodi `goToNextVisitModalStep()` e `goToPreviousVisitModalStep()` se non presenti per navigare tra gli step
5. Usare sempre le chiavi di traduzione per i messaggi visibili all'utente

---

## Testing

Per testare con Postman:
1. Usa `POST /api/tenants/therapeutic-plans/1/visits/2026-05-17T10:00:00/images`
2. Body: form-data con file=<select image> e description=<text>
3. Verifica che la risposta contiene l'ID dell'immagine

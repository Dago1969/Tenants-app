package com.qtm.tenants.therapeuticplan.entity;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * IdClass per la chiave composta della visita: therapeuticPlanId + date
 */
public class TherapeuticPlanVisitId implements Serializable {
    private Long therapeuticPlanId;
    private LocalDate date;

    public TherapeuticPlanVisitId() {
    }

    public TherapeuticPlanVisitId(Long therapeuticPlanId, LocalDate date) {
        this.therapeuticPlanId = therapeuticPlanId;
        this.date = date;
    }

    public Long getTherapeuticPlanId() {
        return therapeuticPlanId;
    }

    public void setTherapeuticPlanId(Long therapeuticPlanId) {
        this.therapeuticPlanId = therapeuticPlanId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        TherapeuticPlanVisitId that = (TherapeuticPlanVisitId) o;

        if (therapeuticPlanId != null ? !therapeuticPlanId.equals(that.therapeuticPlanId) : that.therapeuticPlanId != null)
            return false;
        return date != null ? date.equals(that.date) : that.date == null;
    }

    @Override
    public int hashCode() {
        int result = therapeuticPlanId != null ? therapeuticPlanId.hashCode() : 0;
        result = 31 * result + (date != null ? date.hashCode() : 0);
        return result;
    }
}

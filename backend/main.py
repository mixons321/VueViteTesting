from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class BonusRequest(BaseModel):
    base_salary: float = Field(..., ge=0, description="Salario base mensual del colaborador")
    performance_rating: float = Field(
        ..., ge=0, le=5, description="Calificación de desempeño entre 0 y 5"
    )
    years_at_company: float = Field(..., ge=0, description="Años completos dentro de la empresa")
    dependents: int = Field(..., ge=0, description="Número de dependientes declarados")
    extra_awards: float = Field(
        0,
        ge=0,
        description="Bonificaciones adicionales discrecionales ya aprobadas",
    )


class BonusBreakdown(BaseModel):
    base_bonus: float
    performance_adjustment: float
    loyalty_bonus: float
    family_support: float
    extra_awards: float
    total_bonus: float


class BonusResponse(BaseModel):
    total_bonus: float
    breakdown: BonusBreakdown
    recommendations: List[str]
    calculated_at: datetime
    inputs: BonusRequest


app = FastAPI(title="Bonus Calculator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", summary="Estado del servicio")
def healthcheck():
    return {"status": "ok", "message": "Bonus Calculator API"}


def _calculate_bonus(payload: BonusRequest) -> BonusBreakdown:
    base_bonus = round(payload.base_salary * 0.1, 2)
    performance_multiplier = 0.08 * (payload.performance_rating - 3)
    performance_adjustment = round(base_bonus * performance_multiplier, 2)

    loyalty_years = min(payload.years_at_company, 15)
    loyalty_bonus = round(payload.base_salary * 0.015 * loyalty_years, 2)

    family_support = round(min(payload.dependents, 6) * 120, 2)

    extra_awards = round(payload.extra_awards, 2)

    total_bonus = round(
        base_bonus + performance_adjustment + loyalty_bonus + family_support + extra_awards,
        2,
    )

    return BonusBreakdown(
        base_bonus=base_bonus,
        performance_adjustment=performance_adjustment,
        loyalty_bonus=loyalty_bonus,
        family_support=family_support,
        extra_awards=extra_awards,
        total_bonus=total_bonus,
    )


def _build_recommendations(payload: BonusRequest, breakdown: BonusBreakdown) -> List[str]:
    messages: List[str] = []

    if payload.performance_rating >= 4.5:
        messages.append("Excelente desempeño. Considera reconocerlo públicamente en la próxima reunión.")
    elif payload.performance_rating < 2:
        messages.append("Revisa el plan de mejora del colaborador antes de aprobar el bono completo.")

    if payload.years_at_company >= 5:
        messages.append("Valora incluir un beneficio adicional por antigüedad en la compañía.")
    elif payload.years_at_company < 1:
        messages.append("Este bono aplica a talento de reciente incorporación, valida con RRHH.")

    if payload.dependents >= 3:
        messages.append("La asignación familiar representa una parte importante del bono.")

    if breakdown.total_bonus > payload.base_salary * 0.6:
        messages.append("El bono supera el 60% del salario mensual. Verifica que esté dentro de las políticas.")

    if not messages:
        messages.append("Bono dentro de los parámetros habituales.")

    return messages


@app.post("/api/bonus", response_model=BonusResponse, summary="Calcula un bono a partir de parámetros")
def calculate_bonus(payload: BonusRequest):
    if payload.base_salary == 0:
        raise HTTPException(status_code=400, detail="El salario base debe ser mayor que cero.")

    breakdown = _calculate_bonus(payload)
    recommendations = _build_recommendations(payload, breakdown)

    return BonusResponse(
        total_bonus=breakdown.total_bonus,
        breakdown=breakdown,
        recommendations=recommendations,
        calculated_at=datetime.utcnow(),
        inputs=payload,
    )

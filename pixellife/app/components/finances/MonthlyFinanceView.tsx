"use client";

import { useMonthlyFinance } from "../../hooks/useMonthlyFinance";

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function MonthlyFinanceView() {
  const {
    currentYear,
    currentMonth,
    monthData,
    isLoading,
    goToPreviousMonth,
    goToNextMonth,
  } = useMonthlyFinance();

  if (isLoading) {
    return (
      <div className="p-8 text-center font-pixel" style={{ color: "#999", fontSize: "16px" }}>
        Carregando dados mensais...
      </div>
    );
  }

  if (!monthData) {
    return (
      <div className="p-8 text-center font-pixel" style={{ color: "#999", fontSize: "16px" }}>
        Nenhum dado disponível
      </div>
    );
  }

  const { summary, monthBalance, predictedEndBalance, budgetTips, dailyTotals, reserveAccumulated } =
    monthData;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const today = new Date();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-pixel-bold" style={{ color: "#333", fontSize: "20px" }}>
          {monthNames[currentMonth - 1]} de {currentYear}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1 rounded font-pixel-bold transition-colors hover:bg-[#cce0ff]"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #000",
              color: "#111",
              fontSize: "16px",
            }}
          >
            ←
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1 rounded font-pixel-bold transition-colors hover:bg-[#cce0ff]"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #000",
              color: "#111",
              fontSize: "16px",
            }}
          >
            →
          </button>
        </div>
      </div>

      <div
        className="p-5 rounded-sm"
        style={{
          backgroundColor: "#e8e8e8",
          border: "1px solid #e8e8e2",
        }}
      >
        <h3 className="font-pixel-bold mb-4" style={{ color: "#111", fontSize: "18px", fontWeight: "700" }}>
          Resumo Mensal
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="font-pixel text-xs mb-1" style={{ color: "#666" }}>
              Total Gasto
            </p>
            <p className="font-pixel-bold" style={{ color: "#cf4444", fontSize: "18px" }}>
              R$ {summary.totalExpense.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="font-pixel text-xs mb-1" style={{ color: "#666" }}>
              Total Ganho
            </p>
            <p className="font-pixel-bold" style={{ color: "#4ac26b", fontSize: "18px" }}>
              R$ {summary.totalGain.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="font-pixel text-xs mb-1" style={{ color: "#666" }}>
              Total Reservado
            </p>
            <p className="font-pixel-bold" style={{ color: "#6daffe", fontSize: "18px" }}>
              R$ {summary.totalReserved.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="font-pixel text-xs mb-1" style={{ color: "#666" }}>
              Saldo Final
            </p>
            <p
              className="font-pixel-bold"
              style={{
                color: monthBalance.finalBalance >= 0 ? "#4ac26b" : "#cf4444",
                fontSize: "18px",
              }}
            >
              R$ {monthBalance.finalBalance.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="font-pixel text-xs mb-1" style={{ color: "#666" }}>
              Dia com Maior Gasto
            </p>
            <p className="font-pixel-bold" style={{ color: "#333", fontSize: "16px" }}>
              Dia {summary.dayWithMostExpense}
            </p>
          </div>
          <div>
            <p className="font-pixel text-xs mb-1" style={{ color: "#666" }}>
              Dia com Maior Ganho
            </p>
            <p className="font-pixel-bold" style={{ color: "#333", fontSize: "16px" }}>
              Dia {summary.dayWithMostGain}
            </p>
          </div>
          <div>
            <p className="font-pixel text-xs mb-1" style={{ color: "#666" }}>
              Dias Positivos
            </p>
            <p className="font-pixel-bold" style={{ color: "#4ac26b", fontSize: "16px" }}>
              {summary.positiveDays}
            </p>
          </div>
          <div>
            <p className="font-pixel text-xs mb-1" style={{ color: "#666" }}>
              Dias Negativos
            </p>
            <p className="font-pixel-bold" style={{ color: "#cf4444", fontSize: "16px" }}>
              {summary.negativeDays}
            </p>
          </div>
        </div>
      </div>

      {today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth && (
        <div
          className="p-5 rounded-sm"
          style={{
            backgroundColor: "#fff9e6",
            border: "1px solid #ffd24d",
          }}
        >
          <h3 className="font-pixel-bold mb-2" style={{ color: "#111", fontSize: "16px" }}>
            Previsão do Final do Mês
          </h3>
          <p
            className="font-pixel-bold"
            style={{
              color: predictedEndBalance >= 0 ? "#4ac26b" : "#cf4444",
              fontSize: "18px",
            }}
          >
            R$ {predictedEndBalance.toFixed(2)}
          </p>
          <p className="font-pixel text-xs mt-1" style={{ color: "#666" }}>
            Baseado na média diária até agora
          </p>
        </div>
      )}

      {budgetTips.length > 0 && (
        <div
          className="p-5 rounded-sm"
          style={{
            backgroundColor: "#f0f8ff",
            border: "1px solid #6daffe",
          }}
        >
          <h3 className="font-pixel-bold mb-3" style={{ color: "#111", fontSize: "16px" }}>
            Dicas de Orçamento
          </h3>
          <div className="space-y-2">
            {budgetTips.map((tip, index) => {
              let bgColor = "#e3f2fd";
              let borderColor = "#6daffe";
              if (tip.type === "warning") {
                bgColor = "#fff3e0";
                borderColor = "#ff9800";
              } else if (tip.type === "alert") {
                bgColor = "#ffebee";
                borderColor = "#f44336";
              } else if (tip.type === "limit") {
                bgColor = "#e8f5e9";
                borderColor = "#4caf50";
              }

              return (
                <div
                  key={index}
                  className="p-3 rounded-sm"
                  style={{
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <p className="font-pixel" style={{ color: "#333", fontSize: "14px" }}>
                    {tip.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-md overflow-hidden" style={{ border: "2px solid #000", boxShadow: "4px 4px 0 0 #000" }}>
        <div className="grid grid-cols-[70px_1fr_120px_120px_120px_120px] bg-[#d0d0d0] border-b-2 border-[#000]">
          <div
            className="p-3 font-pixel font-pixel-bold border-r-2 border-[#000]"
            style={{ color: "#111", fontSize: "16px", fontWeight: "700", backgroundColor: "#c0c0c0" }}
          >
            Dia
          </div>
          <div
            className="p-3 font-pixel font-pixel-bold border-r-2 border-[#000]"
            style={{ color: "#111", fontSize: "16px", fontWeight: "700", backgroundColor: "#c0c0c0" }}
          >
            Detalhes
          </div>
          <div
            className="p-3 font-pixel font-pixel-bold border-r-2 border-[#000] text-center"
            style={{ color: "#111", fontSize: "16px", fontWeight: "700", backgroundColor: "#c0c0c0" }}
          >
            Gastos
          </div>
          <div
            className="p-3 font-pixel font-pixel-bold border-r-2 border-[#000] text-center"
            style={{ color: "#111", fontSize: "16px", fontWeight: "700", backgroundColor: "#c0c0c0" }}
          >
            Ganhos
          </div>
          <div
            className="p-3 font-pixel font-pixel-bold border-r-2 border-[#000] text-center"
            style={{ color: "#111", fontSize: "16px", fontWeight: "700", backgroundColor: "#c0c0c0" }}
          >
            Saldo Diário
          </div>
          <div
            className="p-3 font-pixel font-pixel-bold text-center"
            style={{ color: "#111", fontSize: "16px", fontWeight: "700", backgroundColor: "#c0c0c0" }}
          >
            Reserva
          </div>
        </div>
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const isDisabled = day > daysInMonth;
            const isToday =
              today.getFullYear() === currentYear &&
              today.getMonth() + 1 === currentMonth &&
              today.getDate() === day;

            const dayData = dailyTotals.find((d) => d.day === day);
            const reserve = reserveAccumulated[day] || 0;

            return (
              <div
                key={day}
                className={`grid grid-cols-[70px_1fr_120px_120px_120px_120px] border-b border-[#000] last:border-b-0 ${
                  isDisabled ? "opacity-50" : ""
                } ${isToday ? "ring-2 ring-[#6daffe] ring-offset-1" : ""}`}
                style={{
                  backgroundColor: day % 2 === 0 ? "#ffffff" : "#f8f8f8",
                  cursor: isDisabled ? "default" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.backgroundColor = "#f0f8ff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.backgroundColor = day % 2 === 0 ? "#ffffff" : "#f8f8f8";
                  }
                }}
              >
                <div
                  className="p-3 font-pixel border-r border-[#000]"
                  style={{
                    color: isDisabled ? "#999" : isToday ? "#6daffe" : "#333",
                    fontSize: "16px",
                    fontWeight: isToday ? "700" : "400",
                  }}
                >
                  {isDisabled ? "–" : day}
                </div>
                <div
                  className="p-3 font-pixel border-r border-[#000]"
                  style={{
                    color: isDisabled ? "#999" : "#333",
                    fontSize: "16px",
                  }}
                >
                  {isDisabled ? "–" : dayData?.details || "–"}
                </div>
                <div
                  className="p-3 font-pixel-bold border-r border-[#000] text-center"
                  style={{
                    color: isDisabled ? "#999" : "#cf4444",
                    fontSize: "16px",
                  }}
                >
                  {isDisabled
                    ? "–"
                    : dayData
                      ? `R$ ${dayData.totalExpense.toFixed(2)}`
                      : "R$ 0.00"}
                </div>
                <div
                  className="p-3 font-pixel-bold border-r border-[#000] text-center"
                  style={{
                    color: isDisabled ? "#999" : "#4ac26b",
                    fontSize: "16px",
                  }}
                >
                  {isDisabled
                    ? "–"
                    : dayData
                      ? `R$ ${dayData.totalGain.toFixed(2)}`
                      : "R$ 0.00"}
                </div>
                <div
                  className="p-3 font-pixel-bold border-r border-[#000] text-center"
                  style={{
                    color: isDisabled
                      ? "#999"
                      : dayData && dayData.dailyBalance >= 0
                        ? "#4ac26b"
                        : "#cf4444",
                    fontSize: "16px",
                  }}
                >
                  {isDisabled
                    ? "–"
                    : dayData
                      ? `${dayData.dailyBalance >= 0 ? "+" : ""}R$ ${dayData.dailyBalance.toFixed(2)}`
                      : "R$ 0.00"}
                </div>
                <div
                  className="p-3 font-pixel-bold text-center"
                  style={{
                    color: isDisabled ? "#999" : "#333",
                    fontSize: "16px",
                  }}
                >
                  {isDisabled ? "–" : `R$ ${reserve.toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


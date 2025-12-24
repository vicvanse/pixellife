"""
Replicação da Análise: "A model of changeover behavior in two-alternative choice"
Avellaneda, 2025

Pipeline completo de processamento e visualização
"""

import os
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.optimize import curve_fit
import warnings

# Implementação simples de LOWESS (Local Weighted Scatterplot Smoothing)
def lowess(x, y, frac=0.5, it=3):
    """
    Implementação simples de LOWESS
    """
    n = len(x)
    r = int(np.ceil(frac * n))
    h = [np.sort(np.abs(x - x[i]))[r] for i in range(n)]
    w = np.array([np.clip(np.abs((x - x[i]) / h[i]), 0.0, 1.0) for i in range(n)])
    w = (1 - w ** 3) ** 3
    
    yest = np.zeros(n)
    delta = np.ones(n)
    for iteration in range(it):
        for i in range(n):
            weights = delta * w[:, i]
            b = np.array([np.sum(weights * y), np.sum(weights * y * x)])
            A = np.array([[np.sum(weights), np.sum(weights * x)],
                         [np.sum(weights * x), np.sum(weights * x * x)]])
            beta = np.linalg.lstsq(A, b, rcond=None)[0]
            yest[i] = beta[0] + beta[1] * x[i]
        
        residuals = y - yest
        s = np.median(np.abs(residuals))
        delta = np.clip(residuals / (6.0 * s), -1, 1)
        delta = (1 - delta ** 2) ** 2
    
    return np.column_stack([x, yest])
warnings.filterwarnings('ignore')

# Configuração de estilo
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (16, 12)
plt.rcParams['font.size'] = 11
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['axes.titlesize'] = 13
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10


def parse_filename(filename: str) -> dict:
    """Extrai informações do nome do arquivo"""
    pattern = r'F__P(\d+)_C(\d+)_S(\d+)_O(\d+)\.txt'
    match = re.match(pattern, filename)
    if match:
        return {
            'participant': int(match.group(1)),
            'condition': int(match.group(2)),
            'session': int(match.group(3)),
            'option': int(match.group(4))
        }
    return None


def find_fixation_files(directory: str = '.') -> list:
    """Encontra todos os arquivos F__ (Fixations)"""
    fixation_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.startswith('F__') and file.endswith('.txt'):
                full_path = os.path.join(root, file)
                fixation_files.append(full_path)
    return sorted(fixation_files)


def process_session(filepath: str) -> dict:
    """
    Processa uma sessão individual:
    - Agrupa por TRIAL_INDEX
    - Identifica Runs e Changeovers
    - Calcula métricas básicas
    """
    try:
        df = pd.read_csv(filepath, sep='\t', encoding='utf-8')
        
        # Verifica colunas necessárias
        required_cols = ['TRIAL_INDEX', 'LADO', 'ACCURACY']
        if not all(col in df.columns for col in required_cols):
            return None
        
        # Remove NaN e valores inválidos
        df = df[df['LADO'].notna()]
        df = df[df['TRIAL_INDEX'].notna()]
        df = df[df['ACCURACY'].notna()]
        
        # Filtra apenas valores válidos de LADO (1 ou 2)
        df = df[df['LADO'].isin([1, 2, '1', '2'])]
        
        if len(df) == 0:
            return None
        
        # Converte LADO para int
        df['LADO'] = pd.to_numeric(df['LADO'], errors='coerce')
        df = df[df['LADO'].isin([1, 2])]  # Mantém apenas 1 ou 2
        
        # Converte ACCURACY para numérico
        df['ACCURACY'] = pd.to_numeric(df['ACCURACY'], errors='coerce').fillna(0)
        
        # Agrupa por TRIAL_INDEX para obter 1 linha por tentativa
        def get_most_common(x):
            if len(x) == 0:
                return np.nan
            mode = x.mode()
            if len(mode) > 0:
                return mode.iloc[0]
            return x.iloc[0]
        
        trial_data = df.groupby('TRIAL_INDEX').agg({
            'LADO': get_most_common,
            'ACCURACY': 'sum'  # Soma de reforços no trial
        }).reset_index()
        
        trial_data = trial_data.sort_values('TRIAL_INDEX')
        trial_data['ACCURACY'] = (pd.to_numeric(trial_data['ACCURACY'], errors='coerce') > 0).astype(int)  # Binário: teve reforço ou não
        
        choices = trial_data['LADO'].values.astype(int)
        reinforcements = trial_data['ACCURACY'].values
        
        if len(choices) == 0:
            return None
        
        # Identifica Changeovers (trocas)
        changeovers = []
        for i in range(1, len(choices)):
            if choices[i] != choices[i-1]:
                changeovers.append(i)
        
        num_changeovers = len(changeovers)
        
        # Identifica Runs (sequências consecutivas do mesmo lado)
        runs = []
        current_run = {'lado': choices[0], 'start_idx': 0, 'length': 1, 'trials': [0]}
        
        for i in range(1, len(choices)):
            if choices[i] == current_run['lado']:
                current_run['length'] += 1
                current_run['trials'].append(i)
            else:
                runs.append(current_run)
                current_run = {'lado': choices[i], 'start_idx': i, 'length': 1, 'trials': [i]}
        runs.append(current_run)
        
        # Separa por lado
        runs_side1 = [r for r in runs if r['lado'] == 1]
        runs_side2 = [r for r in runs if r['lado'] == 2]
        
        # Calcula métricas por lado
        # Lado 1 (Esquerda)
        N1 = len([c for c in choices if c == 1])  # Número de escolhas
        R1 = sum([reinforcements[i] for i in range(len(choices)) if choices[i] == 1])  # Reforços
        num_runs1 = len(runs_side1)
        d1 = N1 / num_runs1 if num_runs1 > 0 else np.nan  # Permanência média
        lambda1 = 1.0 / d1 if not np.isnan(d1) and d1 > 0 else np.nan  # Taxa de saída
        
        # Lado 2 (Direita)
        N2 = len([c for c in choices if c == 2])
        R2 = sum([reinforcements[i] for i in range(len(choices)) if choices[i] == 2])
        num_runs2 = len(runs_side2)
        d2 = N2 / num_runs2 if num_runs2 > 0 else np.nan
        lambda2 = 1.0 / d2 if not np.isnan(d2) and d2 > 0 else np.nan
        
        # Changeover Rate (Taxa de Troca)
        total_trials = len(choices)
        changeover_rate = num_changeovers / total_trials if total_trials > 0 else np.nan
        
        # Extrai informações do arquivo
        file_info = parse_filename(os.path.basename(filepath))
        
        return {
            'file_info': file_info,
            'total_trials': total_trials,
            'N1': N1,
            'N2': N2,
            'R1': R1,
            'R2': R2,
            'num_runs1': num_runs1,
            'num_runs2': num_runs2,
            'd1': d1,
            'd2': d2,
            'lambda1': lambda1,
            'lambda2': lambda2,
            'num_changeovers': num_changeovers,
            'changeover_rate': changeover_rate
        }
    
    except Exception as e:
        print(f"Erro ao processar {filepath}: {e}")
        return None


def aggregate_by_condition(session_results: list) -> pd.DataFrame:
    """
    Agrega dados por Participante e Condição (soma sessões)
    Recalcula taxas finais após agregação
    """
    # Agrupa por participante e condição
    grouped = {}
    
    for result in session_results:
        if result is None:
            continue
        
        info = result['file_info']
        key = (info['participant'], info['condition'])
        
        if key not in grouped:
            grouped[key] = {
                'participant': info['participant'],
                'condition': info['condition'],
                'total_trials': 0,
                'N1': 0,
                'N2': 0,
                'R1': 0,
                'R2': 0,
                'num_runs1': 0,
                'num_runs2': 0,
                'num_changeovers': 0
            }
        
        grouped[key]['total_trials'] += result['total_trials']
        grouped[key]['N1'] += result['N1']
        grouped[key]['N2'] += result['N2']
        grouped[key]['R1'] += result['R1']
        grouped[key]['R2'] += result['R2']
        grouped[key]['num_runs1'] += result['num_runs1']
        grouped[key]['num_runs2'] += result['num_runs2']
        grouped[key]['num_changeovers'] += result['num_changeovers']
    
    # Recalcula taxas após agregação
    aggregated_data = []
    
    for key, data in grouped.items():
        # Recalcula permanência e lambda
        d1 = data['N1'] / data['num_runs1'] if data['num_runs1'] > 0 else np.nan
        d2 = data['N2'] / data['num_runs2'] if data['num_runs2'] > 0 else np.nan
        lambda1 = 1.0 / d1 if not np.isnan(d1) and d1 > 0 else np.nan
        lambda2 = 1.0 / d2 if not np.isnan(d2) and d2 > 0 else np.nan
        
        # Changeover rate
        changeover_rate = data['num_changeovers'] / data['total_trials'] if data['total_trials'] > 0 else np.nan
        
        # Taxa relativa de reforço
        total_reinforcements = data['R1'] + data['R2']
        relative_reinforcement = data['R1'] / total_reinforcements if total_reinforcements > 0 else np.nan
        
        # Proporções
        total_choices = data['N1'] + data['N2']
        prop1 = data['N1'] / total_choices if total_choices > 0 else np.nan
        
        # Log razão de escolhas
        log_preference = np.log10(data['N1'] / data['N2']) if data['N1'] > 0 and data['N2'] > 0 else np.nan
        
        # Soma das taxas de saída
        sum_lambdas = lambda1 + lambda2 if not np.isnan(lambda1) and not np.isnan(lambda2) else np.nan
        
        # Proporção prevista pelo leaving-matching
        predicted_prop1 = lambda2 / (lambda1 + lambda2) if not np.isnan(lambda1) and not np.isnan(lambda2) and (lambda1 + lambda2) > 0 else np.nan
        
        # Log razão de lambdas
        log_lambda_ratio = np.log10(lambda2 / lambda1) if not np.isnan(lambda1) and not np.isnan(lambda2) and lambda1 > 0 and lambda2 > 0 else np.nan
        
        aggregated_data.append({
            'Participant': data['participant'],
            'Condition': data['condition'],
            'Total_Trials': data['total_trials'],
            'N1': data['N1'],
            'N2': data['N2'],
            'R1': data['R1'],
            'R2': data['R2'],
            'Num_Runs1': data['num_runs1'],
            'Num_Runs2': data['num_runs2'],
            'd1': d1,
            'd2': d2,
            'Lambda1': lambda1,
            'Lambda2': lambda2,
            'Num_Changeovers': data['num_changeovers'],
            'Changeover_Rate': changeover_rate,
            'Relative_Reinforcement': relative_reinforcement,
            'Observed_Prop1': prop1,
            'Log_Preference': log_preference,
            'Sum_Lambdas': sum_lambdas,
            'Predicted_Prop1': predicted_prop1,
            'Log_Lambda_Ratio': log_lambda_ratio
        })
    
    return pd.DataFrame(aggregated_data)


def plot_changeover_rate_vs_reinforcement(df: pd.DataFrame, ax):
    """
    Gráfico 1: Changeover Rate vs. Relative Reinforcement
    Réplica da Fig. 2/7 de Avellaneda (2025)
    """
    # Remove NaN
    df_clean = df[df['Changeover_Rate'].notna() & df['Relative_Reinforcement'].notna()].copy()
    
    if len(df_clean) == 0:
        ax.text(0.5, 0.5, 'Dados insuficientes', ha='center', va='center', transform=ax.transAxes)
        return
    
    x = df_clean['Relative_Reinforcement'].values
    y = df_clean['Changeover_Rate'].values
    
    # Scatter plot
    ax.scatter(x, y, s=100, alpha=0.7, color='steelblue', edgecolors='black', linewidth=1, zorder=3)
    
    # Ajusta curva quadrática (parábola)
    try:
        # Ordena para ajuste
        sort_idx = np.argsort(x)
        x_sorted = x[sort_idx]
        y_sorted = y[sort_idx]
        
        # Ajuste quadrático
        def quadratic(x, a, b, c):
            return a * (x - b)**2 + c
        
        # Estimativa inicial: parábola com pico em 0.5
        p0 = [-1, 0.5, np.max(y)]
        popt, _ = curve_fit(quadratic, x_sorted, y_sorted, p0=p0, maxfev=5000)
        
        x_fit = np.linspace(x.min(), x.max(), 100)
        y_fit = quadratic(x_fit, *popt)
        ax.plot(x_fit, y_fit, 'r-', linewidth=2, label='Ajuste Quadrático', zorder=2)
        
        # LOWESS smoothing
        smoothed = lowess(y_sorted, x_sorted, frac=0.5, it=3)
        ax.plot(smoothed[:, 0], smoothed[:, 1], 'g--', linewidth=2, label='LOWESS', alpha=0.7, zorder=2)
        
    except:
        # Se ajuste falhar, usa apenas LOWESS
        sort_idx = np.argsort(x)
        x_sorted = x[sort_idx]
        y_sorted = y[sort_idx]
        smoothed = lowess(y_sorted, x_sorted, frac=0.5, it=3)
        ax.plot(smoothed[:, 0], smoothed[:, 1], 'g--', linewidth=2, label='LOWESS', alpha=0.7)
    
    ax.set_xlabel('Taxa Relativa de Reforço (R₁/(R₁+R₂))', fontsize=12, fontweight='bold')
    ax.set_ylabel('Taxa de Troca (Changeovers/Trial)', fontsize=12, fontweight='bold')
    ax.set_title('Gráfico 1: Changeover Rate vs. Relative Reinforcement\n(Réplica Fig. 2/7, Avellaneda 2025)', 
                fontsize=13, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_xlim([0, 1])


def plot_sum_lambdas_vs_log_preference(df: pd.DataFrame, ax):
    """
    Gráfico 2: Sum of Leaving Rates vs. Log Preference
    Réplica da Fig. 3 de Avellaneda (2025)
    """
    df_clean = df[df['Sum_Lambdas'].notna() & df['Log_Preference'].notna()].copy()
    
    if len(df_clean) == 0:
        ax.text(0.5, 0.5, 'Dados insuficientes', ha='center', va='center', transform=ax.transAxes)
        return
    
    x = df_clean['Log_Preference'].values
    y = df_clean['Sum_Lambdas'].values
    
    # Scatter plot
    ax.scatter(x, y, s=100, alpha=0.7, color='darkgreen', edgecolors='black', linewidth=1, zorder=3)
    
    # Linha horizontal (se soma for constante)
    mean_sum = np.nanmean(y)
    ax.axhline(y=mean_sum, color='red', linestyle='--', linewidth=2, 
              label=f'Média = {mean_sum:.3f}', alpha=0.7, zorder=2)
    
    # Regressão linear
    if len(x) >= 2:
        slope, intercept, r_value, p_value, _ = stats.linregress(x, y)
        x_line = np.linspace(x.min(), x.max(), 100)
        y_line = slope * x_line + intercept
        ax.plot(x_line, y_line, 'b-', linewidth=2, 
               label=f'Regressão (R²={r_value**2:.3f})', alpha=0.7, zorder=2)
    
    ax.set_xlabel('Log₁₀ Razão de Escolhas (log₁₀(N₁/N₂))', fontsize=12, fontweight='bold')
    ax.set_ylabel('Soma das Taxas de Saída (λ₁ + λ₂)', fontsize=12, fontweight='bold')
    ax.set_title('Gráfico 2: Sum of Leaving Rates vs. Log Preference\n(Réplica Fig. 3, Avellaneda 2025)', 
                fontsize=13, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)


def plot_observed_vs_predicted_lambdas(df: pd.DataFrame, ax):
    """
    Gráfico 3: Observed vs. Predicted Leaving Rates (Log-Log)
    Réplica da Fig. 6 de Avellaneda (2025)
    """
    df_clean = df[df['Log_Lambda_Ratio'].notna() & df['Log_Preference'].notna()].copy()
    
    if len(df_clean) == 0:
        ax.text(0.5, 0.5, 'Dados insuficientes', ha='center', va='center', transform=ax.transAxes)
        return None
    
    x = df_clean['Log_Lambda_Ratio'].values
    y = df_clean['Log_Preference'].values
    
    # Scatter plot
    ax.scatter(x, y, s=100, alpha=0.7, color='purple', edgecolors='black', linewidth=1, zorder=3)
    
    # Linha de identidade (y=x) - inclinação 1.0
    min_val = min(x.min(), y.min())
    max_val = max(x.max(), y.max())
    margin = (max_val - min_val) * 0.1
    ax.plot([min_val - margin, max_val + margin], 
           [min_val - margin, max_val + margin], 
           'r--', linewidth=2, label='Identidade (y=x)', alpha=0.7, zorder=2)
    
    # Regressão linear
    if len(x) >= 2:
        slope, intercept, r_value, p_value, _ = stats.linregress(x, y)
        x_line = np.linspace(min_val - margin, max_val + margin, 100)
        y_line = slope * x_line + intercept
        ax.plot(x_line, y_line, 'b-', linewidth=2, 
               label=f'Regressão (slope={slope:.3f}, R²={r_value**2:.3f})', alpha=0.7, zorder=2)
    
    ax.set_xlabel('Log₁₀ Razão de Taxas (log₁₀(λ₂/λ₁))', fontsize=12, fontweight='bold')
    ax.set_ylabel('Log₁₀ Razão de Escolhas (log₁₀(N₁/N₂))', fontsize=12, fontweight='bold')
    ax.set_title('Gráfico 3: Observed vs. Predicted Leaving Rates (Log-Log)\n(Réplica Fig. 6, Avellaneda 2025)', 
                fontsize=13, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_aspect('equal', adjustable='box')
    
    return r_value  # Retorna correlação


def plot_leaving_rate_matching(df: pd.DataFrame, ax):
    """
    Gráfico 4: Leaving-Rate Matching (Eq. 2)
    """
    df_clean = df[df['Predicted_Prop1'].notna() & df['Observed_Prop1'].notna()].copy()
    
    if len(df_clean) == 0:
        ax.text(0.5, 0.5, 'Dados insuficientes', ha='center', va='center', transform=ax.transAxes)
        return None
    
    x = df_clean['Predicted_Prop1'].values
    y = df_clean['Observed_Prop1'].values
    
    # Scatter plot
    ax.scatter(x, y, s=100, alpha=0.7, color='orange', edgecolors='black', linewidth=1, zorder=3)
    
    # Linha de identidade (y=x)
    min_val = min(x.min(), y.min())
    max_val = max(x.max(), y.max())
    margin = (max_val - min_val) * 0.1
    ax.plot([min_val - margin, max_val + margin], 
           [min_val - margin, max_val + margin], 
           'r--', linewidth=2, label='Identidade (y=x)', alpha=0.7, zorder=2)
    
    # Regressão linear
    if len(x) >= 2:
        slope, intercept, r_value, p_value, _ = stats.linregress(x, y)
        x_line = np.linspace(min_val - margin, max_val + margin, 100)
        y_line = slope * x_line + intercept
        ax.plot(x_line, y_line, 'b-', linewidth=2, 
               label=f'Regressão (slope={slope:.3f}, R²={r_value**2:.3f})', alpha=0.7, zorder=2)
    
    ax.set_xlabel('Proporção Prevista (λ₂/(λ₁+λ₂))', fontsize=12, fontweight='bold')
    ax.set_ylabel('Proporção Observada (N₁/Total)', fontsize=12, fontweight='bold')
    ax.set_title('Gráfico 4: Leaving-Rate Matching (Eq. 2)\n(Avellaneda 2025)', 
                fontsize=13, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_aspect('equal', adjustable='box')
    
    return r_value  # Retorna correlação


def main():
    """Função principal"""
    print("=" * 80)
    print("Replicação: A model of changeover behavior in two-alternative choice")
    print("Avellaneda, 2025")
    print("=" * 80)
    print()
    
    # 1. Encontra arquivos
    print("1. Detectando arquivos de Fixações...")
    fixation_files = find_fixation_files('.')
    print(f"   Arquivos encontrados: {len(fixation_files)}")
    print()
    
    # 2. Processa cada sessão
    print("2. Processando sessões individuais...")
    session_results = []
    for filepath in fixation_files:
        result = process_session(filepath)
        if result:
            session_results.append(result)
    print(f"   Sessões processadas: {len(session_results)}")
    print()
    
    # 3. Agrega por condição
    print("3. Agregando dados por condição...")
    df_aggregated = aggregate_by_condition(session_results)
    print(f"   Condições agregadas: {len(df_aggregated)}")
    print()
    
    # 4. Salva DataFrame
    output_file = 'avellaneda_replication_results.csv'
    df_aggregated.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"4. Dados salvos em: {output_file}")
    print()
    
    # 5. Gera gráficos
    print("5. Gerando gráficos...")
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    axes = axes.flatten()
    
    # Gráfico 1
    plot_changeover_rate_vs_reinforcement(df_aggregated, axes[0])
    
    # Gráfico 2
    plot_sum_lambdas_vs_log_preference(df_aggregated, axes[1])
    
    # Gráfico 3
    corr3 = plot_observed_vs_predicted_lambdas(df_aggregated, axes[2])
    
    # Gráfico 4
    corr4 = plot_leaving_rate_matching(df_aggregated, axes[3])
    
    plt.tight_layout()
    plt.savefig('avellaneda_replication_figures.png', dpi=300, bbox_inches='tight')
    print("   Gráficos salvos em: avellaneda_replication_figures.png")
    print()
    
    # 6. Estatísticas
    print("6. Estatísticas de Correlação:")
    print("-" * 80)
    if corr3 is not None:
        print(f"Gráfico 3 (Log-Log Leaving Rates):")
        print(f"  Correlação de Pearson: r = {corr3:.4f}")
        print(f"  R² = {corr3**2:.4f}")
        print()
    
    if corr4 is not None:
        print(f"Gráfico 4 (Leaving-Rate Matching):")
        print(f"  Correlação de Pearson: r = {corr4:.4f}")
        print(f"  R² = {corr4**2:.4f}")
        print()
    
    # Estatísticas descritivas
    print("7. Estatísticas Descritivas:")
    print("-" * 80)
    print(df_aggregated[['Lambda1', 'Lambda2', 'Changeover_Rate', 'Relative_Reinforcement', 
                        'Observed_Prop1', 'Predicted_Prop1']].describe())
    print()
    
    print("=" * 80)
    print("Análise concluída com sucesso!")
    print("=" * 80)


if __name__ == '__main__':
    main()


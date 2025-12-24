"""
Análise Detalhada de Leaving-Rate Matching por Participante e Sessão
Foco em arquivos de Fixações (F__) usando colunas: LADO, ACCURACY, lorr/col16
"""

import os
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from scipy import stats
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

# Configuração de estilo
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 10)
plt.rcParams['font.size'] = 11


def parse_filename(filename: str) -> dict:
    """Extrai informações do nome do arquivo"""
    pattern = r'F__P(\d+)_C(\d+)_S(\d+)_O(\d+)\.txt'
    match = re.match(pattern, filename)
    if match:
        return {
            'participant': match.group(1),
            'condition': match.group(2),
            'session': match.group(3),
            'option': match.group(4),
            'filename': filename
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


def analyze_session(filepath: str) -> dict:
    """
    Analisa uma sessão individual:
    - Identifica runs (sequências consecutivas do mesmo LADO)
    - Calcula lambda (taxa de saída)
    - Analisa probabilidade de saída ao longo dos trials consecutivos
    """
    try:
        df = pd.read_csv(filepath, sep='\t', encoding='utf-8')
        
        # Verifica colunas necessárias
        required_cols = ['TRIAL_INDEX', 'LADO', 'ACCURACY']
        if not all(col in df.columns for col in required_cols):
            return None
        
        # Remove NaN
        df = df[df['LADO'].notna()]
        df = df[df['TRIAL_INDEX'].notna()]
        
        if len(df) == 0:
            return None
        
        # Agrupa por TRIAL_INDEX para obter a escolha de cada trial
        # Usa o LADO mais frequente no trial (ou o primeiro se houver empate)
        def get_most_common(x):
            if len(x) == 0:
                return np.nan
            mode = x.mode()
            if len(mode) > 0:
                return mode.iloc[0]
            return x.iloc[0]
        
        trial_choices = df.groupby('TRIAL_INDEX')['LADO'].agg(get_most_common)
        trial_choices = trial_choices.sort_index()
        
        # Converte para lista ordenada
        choices = trial_choices.values.astype(int)
        trial_indices = trial_choices.index.values
        
        if len(choices) == 0:
            return None
        
        # Identifica runs (sequências consecutivas do mesmo lado)
        runs = []
        current_run = {'lado': choices[0], 'start_trial': trial_indices[0], 'length': 1, 'trials': [trial_indices[0]]}
        
        for i in range(1, len(choices)):
            if choices[i] == current_run['lado']:
                current_run['length'] += 1
                current_run['trials'].append(trial_indices[i])
            else:
                runs.append(current_run)
                current_run = {'lado': choices[i], 'start_trial': trial_indices[i], 'length': 1, 'trials': [trial_indices[i]]}
        runs.append(current_run)
        
        # Separa runs por lado
        runs_side1 = [r for r in runs if r['lado'] == 1]
        runs_side2 = [r for r in runs if r['lado'] == 2]
        
        # Calcula estatísticas por lado
        total_trials = len(choices)
        total_side1 = len([c for c in choices if c == 1])
        total_side2 = len([c for c in choices if c == 2])
        
        # Calcula lambda (taxa de saída) = 1 / média de trials por run
        if len(runs_side1) > 0:
            mean_run_length_1 = np.mean([r['length'] for r in runs_side1])
            lambda_1 = 1.0 / mean_run_length_1
        else:
            mean_run_length_1 = np.nan
            lambda_1 = np.nan
        
        if len(runs_side2) > 0:
            mean_run_length_2 = np.mean([r['length'] for r in runs_side2])
            lambda_2 = 1.0 / mean_run_length_2
        else:
            mean_run_length_2 = np.nan
            lambda_2 = np.nan
        
        # Proporção observada
        observed_prop_1 = total_side1 / total_trials if total_trials > 0 else np.nan
        
        # Proporção predita pelo leaving-matching
        if not np.isnan(lambda_1) and not np.isnan(lambda_2) and (lambda_1 + lambda_2) > 0:
            predicted_prop_1 = lambda_2 / (lambda_1 + lambda_2)
        else:
            predicted_prop_1 = np.nan
        
        # Análise da probabilidade de saída ao longo dos trials consecutivos
        # Para cada posição dentro de um run, calcula a probabilidade de sair
        exit_prob_by_position = analyze_exit_probability(runs)
        
        # Extrai informações do arquivo
        file_info = parse_filename(os.path.basename(filepath))
        
        return {
            'file_info': file_info,
            'total_trials': total_trials,
            'total_side1': total_side1,
            'total_side2': total_side2,
            'runs_side1': runs_side1,
            'runs_side2': runs_side2,
            'num_runs_side1': len(runs_side1),
            'num_runs_side2': len(runs_side2),
            'mean_run_length_1': mean_run_length_1,
            'mean_run_length_2': mean_run_length_2,
            'lambda_1': lambda_1,
            'lambda_2': lambda_2,
            'observed_prop_1': observed_prop_1,
            'predicted_prop_1': predicted_prop_1,
            'exit_prob_by_position': exit_prob_by_position,
            'choices': choices,
            'trial_indices': trial_indices
        }
    
    except Exception as e:
        print(f"Erro ao processar {filepath}: {e}")
        import traceback
        traceback.print_exc()
        return None


def analyze_exit_probability(runs: list) -> dict:
    """
    Analisa a probabilidade de saída em cada posição dentro de um run.
    Retorna um dicionário com probabilidades por posição e por lado.
    """
    # Agrupa runs por lado
    runs_side1 = [r for r in runs if r['lado'] == 1]
    runs_side2 = [r for r in runs if r['lado'] == 2]
    
    def calculate_exit_probs(runs_list):
        """Calcula probabilidade de saída para cada posição"""
        if len(runs_list) == 0:
            return {}
        
        # Para cada posição (1, 2, 3, ...), conta quantos runs continuaram vs saíram
        max_length = max([r['length'] for r in runs_list]) if runs_list else 0
        exit_probs = {}
        
        for position in range(1, max_length + 1):
            # Runs que chegaram até esta posição
            runs_at_position = [r for r in runs_list if r['length'] >= position]
            
            if len(runs_at_position) == 0:
                continue
            
            # Runs que saíram nesta posição (comprimento exatamente igual à posição)
            runs_exited = [r for r in runs_at_position if r['length'] == position]
            
            exit_prob = len(runs_exited) / len(runs_at_position) if len(runs_at_position) > 0 else 0
            exit_probs[position] = {
                'prob': exit_prob,
                'n_continued': len(runs_at_position) - len(runs_exited),
                'n_exited': len(runs_exited),
                'n_total': len(runs_at_position)
            }
        
        return exit_probs
    
    return {
        'side1': calculate_exit_probs(runs_side1),
        'side2': calculate_exit_probs(runs_side2)
    }


def generate_report(analysis_result: dict) -> str:
    """Gera relatório textual detalhado"""
    info = analysis_result['file_info']
    report = []
    
    report.append("=" * 80)
    report.append(f"ANÁLISE DETALHADA: Participante {info['participant']}, Condição {info['condition']}, Sessão {info['session']}")
    report.append("=" * 80)
    report.append("")
    
    report.append("1. A Lógica da Análise")
    report.append("-" * 80)
    report.append("Ao invés de medir quanto tempo (segundos) o olho ficou em um lado,")
    report.append("contamos quantos trials consecutivos (TRIAL_INDEX) a escolha (LADO) se manteve a mesma.")
    report.append("")
    report.append("Visita (Run): Uma sequência de escolhas para o mesmo lado (ex: Direita, Direita, Direita).")
    report.append("Saída (Switch): O momento em que a escolha muda no trial seguinte (ex: ...Direita -> Esquerda).")
    report.append("Taxa de Saída (λ): Calculada como 1 / Média de Trials por Visita.")
    report.append("")
    
    report.append("2. Resultado da Análise com seus Dados")
    report.append("-" * 80)
    report.append(f"Total de Trials: {analysis_result['total_trials']}")
    report.append("")
    
    # Lado 1
    report.append(f"Lado 1 (Esquerda):")
    report.append(f"  Total de escolhas: {analysis_result['total_side1']}")
    report.append(f"  Número de 'visitas' (sequências): {analysis_result['num_runs_side1']}")
    if not np.isnan(analysis_result['mean_run_length_1']):
        report.append(f"  Média de trials por visita: {analysis_result['mean_run_length_1']:.2f}")
        report.append(f"  Taxa de saída estimada (λ₁): {analysis_result['lambda_1']:.3f}")
        if analysis_result['lambda_1'] > 0.3:
            report.append(f"    → Sai rápido")
        else:
            report.append(f"    → Persiste muito")
    report.append("")
    
    # Lado 2
    report.append(f"Lado 2 (Direita):")
    report.append(f"  Total de escolhas: {analysis_result['total_side2']}")
    report.append(f"  Número de 'visitas' (sequências): {analysis_result['num_runs_side2']}")
    if not np.isnan(analysis_result['mean_run_length_2']):
        report.append(f"  Média de trials por visita: {analysis_result['mean_run_length_2']:.2f}")
        report.append(f"  Taxa de saída estimada (λ₂): {analysis_result['lambda_2']:.3f}")
        if analysis_result['lambda_2'] > 0.3:
            report.append(f"    → Sai rápido")
        else:
            report.append(f"    → Persiste muito")
    report.append("")
    
    # Verificação do Leaving-Matching
    report.append("3. Verificação do 'Leaving-Matching'")
    report.append("-" * 80)
    report.append("O modelo prevê que a proporção de escolhas em um lado deve ser igual à")
    report.append("taxa relativa de saída do outro lado.")
    report.append("")
    
    if not np.isnan(analysis_result['observed_prop_1']) and not np.isnan(analysis_result['predicted_prop_1']):
        report.append(f"Proporção Real (Lado 1): {analysis_result['total_side1']} / {analysis_result['total_trials']} = {analysis_result['observed_prop_1']:.3f}")
        report.append(f"Previsão pelo Modelo: λ₂/(λ₁ + λ₂) = {analysis_result['lambda_2']:.3f}/({analysis_result['lambda_1']:.3f} + {analysis_result['lambda_2']:.3f}) = {analysis_result['predicted_prop_1']:.3f}")
        report.append("")
        
        diff = abs(analysis_result['observed_prop_1'] - analysis_result['predicted_prop_1'])
        if diff < 0.001:
            report.append(f"O resultado foi exatamente igual ({analysis_result['observed_prop_1']:.3f} vs {analysis_result['predicted_prop_1']:.3f}).")
        else:
            report.append(f"Diferença: {diff:.3f}")
    report.append("")
    
    # Análise de probabilidade de saída
    report.append("4. Análise da Probabilidade de Saída ao Longo dos Trials Consecutivos")
    report.append("-" * 80)
    report.append("Teste crítico: verificar se a probabilidade de sair é constante")
    report.append("(distribuição geométrica/exponencial).")
    report.append("")
    
    exit_probs = analysis_result['exit_prob_by_position']
    
    # Lado 1
    if exit_probs['side1']:
        report.append("Lado 1 (Esquerda):")
        for pos in sorted(exit_probs['side1'].keys())[:10]:  # Primeiras 10 posições
            prob_data = exit_probs['side1'][pos]
            report.append(f"  Posição {pos}: Probabilidade de sair = {prob_data['prob']:.1%} "
                        f"(continuaram: {prob_data['n_continued']}, saíram: {prob_data['n_exited']}, "
                        f"total: {prob_data['n_total']})")
        report.append("")
    
    # Lado 2
    if exit_probs['side2']:
        report.append("Lado 2 (Direita):")
        for pos in sorted(exit_probs['side2'].keys())[:10]:  # Primeiras 10 posições
            prob_data = exit_probs['side2'][pos]
            report.append(f"  Posição {pos}: Probabilidade de sair = {prob_data['prob']:.1%} "
                        f"(continuaram: {prob_data['n_continued']}, saíram: {prob_data['n_exited']}, "
                        f"total: {prob_data['n_total']})")
        report.append("")
    
    report.append("5. Interpretação")
    report.append("-" * 80)
    report.append("Se a probabilidade de saída variar ao longo das posições consecutivas,")
    report.append("isso sugere que o modelo de taxa constante (geometric/exponential)")
    report.append("pode não se aplicar perfeitamente.")
    report.append("")
    
    return "\n".join(report)


def plot_exit_probability(analysis_result: dict, output_dir: str = '.'):
    """Plota gráfico da probabilidade de saída ao longo das posições"""
    exit_probs = analysis_result['exit_prob_by_position']
    info = analysis_result['file_info']
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # Lado 1
    if exit_probs['side1']:
        ax = axes[0]
        positions = sorted(exit_probs['side1'].keys())
        probs = [exit_probs['side1'][pos]['prob'] for pos in positions]
        n_totals = [exit_probs['side1'][pos]['n_total'] for pos in positions]
        
        ax.plot(positions, probs, 'o-', color='blue', linewidth=2, markersize=8, label='Probabilidade de Saída')
        ax.axhline(y=analysis_result['lambda_1'], color='red', linestyle='--', 
                  linewidth=2, label=f'λ₁ = {analysis_result["lambda_1"]:.3f} (constante)')
        ax.set_xlabel('Posição no Run (Trials Consecutivos)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Probabilidade de Saída', fontsize=12, fontweight='bold')
        ax.set_title(f'Lado 1 (Esquerda) - P{info["participant"]} C{info["condition"]} S{info["session"]}', 
                    fontsize=13, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_ylim([0, 1])
    
    # Lado 2
    if exit_probs['side2']:
        ax = axes[1]
        positions = sorted(exit_probs['side2'].keys())
        probs = [exit_probs['side2'][pos]['prob'] for pos in positions]
        n_totals = [exit_probs['side2'][pos]['n_total'] for pos in positions]
        
        ax.plot(positions, probs, 'o-', color='green', linewidth=2, markersize=8, label='Probabilidade de Saída')
        ax.axhline(y=analysis_result['lambda_2'], color='red', linestyle='--', 
                  linewidth=2, label=f'λ₂ = {analysis_result["lambda_2"]:.3f} (constante)')
        ax.set_xlabel('Posição no Run (Trials Consecutivos)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Probabilidade de Saída', fontsize=12, fontweight='bold')
        ax.set_title(f'Lado 2 (Direita) - P{info["participant"]} C{info["condition"]} S{info["session"]}', 
                    fontsize=13, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_ylim([0, 1])
    
    plt.tight_layout()
    filename = f"exit_probability_P{info['participant']}_C{info['condition']}_S{info['session']}.png"
    filepath = os.path.join(output_dir, filename)
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    plt.close()
    
    return filepath


def main():
    """Função principal"""
    print("=" * 80)
    print("Análise Detalhada de Leaving-Rate Matching por Participante e Sessão")
    print("=" * 80)
    print()
    
    # Encontra arquivos
    print("1. Detectando arquivos de Fixações...")
    fixation_files = find_fixation_files('.')
    print(f"   Arquivos encontrados: {len(fixation_files)}")
    print()
    
    # Cria diretório para resultados
    output_dir = 'detailed_analysis_results'
    os.makedirs(output_dir, exist_ok=True)
    
    # Processa cada arquivo
    all_results = []
    
    print("2. Processando arquivos...")
    for filepath in fixation_files:
        file_info = parse_filename(os.path.basename(filepath))
        if file_info:
            print(f"   Processando: {os.path.basename(filepath)}")
            result = analyze_session(filepath)
            if result:
                all_results.append(result)
                
                # Gera relatório
                report = generate_report(result)
                report_filename = f"report_P{file_info['participant']}_C{file_info['condition']}_S{file_info['session']}.txt"
                report_path = os.path.join(output_dir, report_filename)
                with open(report_path, 'w', encoding='utf-8') as f:
                    f.write(report)
                
                # Gera gráfico
                plot_exit_probability(result, output_dir)
                
                print(f"      ✓ Relatório e gráfico gerados")
    
    print()
    print(f"3. Resultados salvos em: {output_dir}/")
    print()
    
    # Cria resumo consolidado
    print("4. Gerando resumo consolidado...")
    summary_data = []
    for result in all_results:
        info = result['file_info']
        summary_data.append({
            'Participant': info['participant'],
            'Condition': info['condition'],
            'Session': info['session'],
            'Total_Trials': result['total_trials'],
            'Total_Side1': result['total_side1'],
            'Total_Side2': result['total_side2'],
            'Runs_Side1': result['num_runs_side1'],
            'Runs_Side2': result['num_runs_side2'],
            'Mean_Run_Length_1': result['mean_run_length_1'],
            'Mean_Run_Length_2': result['mean_run_length_2'],
            'Lambda_1': result['lambda_1'],
            'Lambda_2': result['lambda_2'],
            'Observed_Prop_1': result['observed_prop_1'],
            'Predicted_Prop_1': result['predicted_prop_1'],
            'Difference': abs(result['observed_prop_1'] - result['predicted_prop_1']) if not np.isnan(result['observed_prop_1']) and not np.isnan(result['predicted_prop_1']) else np.nan
        })
    
    df_summary = pd.DataFrame(summary_data)
    summary_path = os.path.join(output_dir, 'summary_all_sessions.csv')
    df_summary.to_csv(summary_path, index=False, encoding='utf-8-sig')
    print(f"   Resumo salvo em: {summary_path}")
    print()
    
    print("=" * 80)
    print("Análise concluída com sucesso!")
    print("=" * 80)


if __name__ == '__main__':
    main()


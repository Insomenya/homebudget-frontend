// FILE: src/widgets/registry.ts
import type { WidgetDef } from '../types/widgets'
import AccountsWidget from './AccountsWidget'
import MonthSummaryWidget from './MonthSummaryWidget'
import SettlementsWidget from './SettlementsWidget'
import PieChartWidget from './PieChartWidget'
import TrendsWidget from './TrendsWidget'
import QuickAddWidget from './QuickAddWidget'
import RecentWidget from './RecentWidget'
import BattleWidget from './BattleWidget'
import PendingWidget from './PendingWidget'
import CategoryBarWidget from './CategoryBarWidget'
import IncomeExpenseWidget from './IncomeExpenseWidget'
import DailyHeatmapWidget from './DailyHeatmapWidget'
import ForecastWidget from './ForecastWidget'

export const WIDGET_REGISTRY: WidgetDef[] = [
  { type: 'accounts', label: 'Балансы счетов', icon: '💳', component: AccountsWidget, initialW: 4, initialH: 8 },
  { type: 'month-summary', label: 'Месяц', icon: '📊', component: MonthSummaryWidget, initialW: 4, initialH: 6 },
  { type: 'pending', label: 'Напоминания и предстоящие', icon: '🔔', component: PendingWidget, initialW: 4, initialH: 6 },
  { type: 'settlements', label: 'Деление расходов', icon: '⚖️', component: SettlementsWidget, initialW: 4, initialH: 6 },
  { type: 'pie-chart', label: 'Категории', icon: '🥧', component: PieChartWidget, initialW: 5, initialH: 9 },
  { type: 'category-bar', label: 'Топ категорий', icon: '📊', component: CategoryBarWidget, initialW: 5, initialH: 9 },
  { type: 'income-expense', label: 'Доходы vs Расходы', icon: '📊', component: IncomeExpenseWidget, initialW: 4, initialH: 9 },
  { type: 'trends', label: 'Динамика', icon: '📈', component: TrendsWidget, initialW: 4, initialH: 9 },
  { type: 'daily-heatmap', label: 'Тепловая карта расходов', icon: '🗓️', component: DailyHeatmapWidget, initialW: 5, initialH: 9 },
  { type: 'forecast', label: 'Прогноз балансов', icon: '🔮', component: ForecastWidget, initialW: 6, initialH: 12 },
  { type: 'quick-add', label: 'Быстрая запись', icon: '⚡', component: QuickAddWidget, initialW: 4, initialH: 12 },
  { type: 'recent', label: 'Последние', icon: '🕐', component: RecentWidget, initialW: 4, initialH: 6 },
  { type: 'battle', label: 'Баланс сил', icon: '⚔️', component: BattleWidget, initialW: 4, initialH: 16 },
]

export const getWidgetDef = (type: string): WidgetDef | undefined =>
  WIDGET_REGISTRY.find((w) => w.type === type)
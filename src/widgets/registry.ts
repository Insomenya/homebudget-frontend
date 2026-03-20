import type { WidgetDef } from '../types/widgets'
import AccountsWidget from './AccountsWidget'
import MonthSummaryWidget from './MonthSummaryWidget'
import SettlementsWidget from './SettlementsWidget'
import PieChartWidget from './PieChartWidget'
import TrendsWidget from './TrendsWidget'
import QuickAddWidget from './QuickAddWidget'
import UpcomingWidget from './UpcomingWidget'
import RecentWidget from './RecentWidget'
import BattleWidget from './BattleWidget'
import PendingWidget from './PendingWidget'
import CategoryBarWidget from './CategoryBarWidget'
import IncomeExpenseWidget from './IncomeExpenseWidget'
import DailyHeatmapWidget from './DailyHeatmapWidget'

export const WIDGET_REGISTRY: WidgetDef[] = [
  { type: 'accounts', label: 'Балансы счетов', icon: '💳', component: AccountsWidget },
  { type: 'month-summary', label: 'Месяц', icon: '📊', component: MonthSummaryWidget },
  { type: 'settlements', label: 'Деление расходов', icon: '⚖️', component: SettlementsWidget },
  { type: 'pie-chart', label: 'Категории', icon: '🥧', component: PieChartWidget },
  { type: 'category-bar', label: 'Топ категорий', icon: '📊', component: CategoryBarWidget },
  { type: 'income-expense', label: 'Доходы vs Расходы', icon: '📊', component: IncomeExpenseWidget },
  { type: 'trends', label: 'Динамика', icon: '📈', component: TrendsWidget },
  { type: 'daily-heatmap', label: 'Тепловая карта расходов', icon: '🗓️', component: DailyHeatmapWidget },
  { type: 'quick-add', label: 'Быстрая запись', icon: '⚡', component: QuickAddWidget },
  { type: 'upcoming', label: 'Предстоящие', icon: '📅', component: UpcomingWidget },
  { type: 'recent', label: 'Последние', icon: '🕐', component: RecentWidget },
  { type: 'battle', label: 'Баланс сил', icon: '⚔️', component: BattleWidget },
  { type: 'pending', label: 'Напоминания', icon: '🔔', component: PendingWidget },
]

export const getWidgetDef = (type: string): WidgetDef | undefined =>
  WIDGET_REGISTRY.find((w) => w.type === type)
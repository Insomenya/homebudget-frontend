import { Children, isValidElement, useMemo, type ReactElement } from 'react'
import { forwardRef } from 'react'
import DropdownSelect, { type DropdownSelectOption } from './DropdownSelect'
import clsx from 'clsx'
import type { SelectProps } from '../../types/ui'

const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ label, error, children, className, value, onChange, ...props }, _ref) => {
    const options = useMemo(() => {
      const result: DropdownSelectOption[] = []
      Children.forEach(children, (child) => {
        if (isValidElement(child) && child.type === 'option') {
          result.push({
            value: String(child.props.value),
            label: String(child.props.children),
            special: child.props['data-special'] !== undefined,
            style: child.props.style,
          })
        }
      })
      return result
    }, [children])

    return (
      <DropdownSelect
        value={String(value ?? '')}
        onChange={(v) => onChange?.({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
        options={options}
        label={label}
        error={error}
        className={className}
        searchable={false}
        {...props}
      />
    )
  },
)

Select.displayName = 'Select'

export default Select

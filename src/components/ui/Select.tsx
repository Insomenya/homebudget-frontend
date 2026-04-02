import { Children, isValidElement, useMemo } from 'react'
import { forwardRef } from 'react'
import DropdownSelect, { type DropdownSelectOption } from './DropdownSelect'
import type { SelectProps } from '../../types/ui'

const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ label, error, children, className, value, onChange, ...props }, _ref) => {
    const options = useMemo(() => {
      const result: DropdownSelectOption[] = []
      Children.forEach(children, (child) => {
        if (isValidElement(child) && child.type === 'option') {
          const cprops = child.props as Record<string, unknown>
          result.push({
            value: String(cprops.value),
            label: String(cprops.children),
            special: cprops['data-special'] !== undefined,
            style: cprops.style as React.CSSProperties | undefined,
          })
        }
      })
      return result
    }, [children])

    const { size: _size, ...restProps } = props
    return (
      <DropdownSelect
        value={String(value ?? '')}
        onChange={(v) => onChange?.({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
        options={options}
        label={label}
        error={error}
        className={className}
        searchable={false}
        {...restProps}
      />
    )
  },
)

Select.displayName = 'Select'

export default Select

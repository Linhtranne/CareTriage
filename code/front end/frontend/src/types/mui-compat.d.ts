import type { ComponentType, ReactNode } from 'react'

type LooseMuiProps = Record<string, unknown> & {
  children?: ReactNode
}

type LooseMuiComponent = ComponentType<LooseMuiProps>

// Compatibility layer for MUI v9 migration (frontend app only).
// Technical debt: remove after Grid/Stack/TextField migration is complete.
declare module '@mui/material' {
  export const Grid: LooseMuiComponent
  export const Stack: LooseMuiComponent
  export const TextField: LooseMuiComponent
  export const Dialog: LooseMuiComponent
  export const Drawer: LooseMuiComponent
  export const ListItemText: LooseMuiComponent
  export const Alert: LooseMuiComponent
  export const Typography: LooseMuiComponent
}

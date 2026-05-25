import type { ComponentType, ReactNode } from 'react'

type LooseMuiProps = Record<string, unknown> & {
  children?: ReactNode
}

type LooseMuiComponent = ComponentType<LooseMuiProps>

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

declare module '@mui/x-data-grid' {
  export const GridToolbarExport: LooseMuiComponent
}

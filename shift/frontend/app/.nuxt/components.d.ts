
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T extends DefineComponent> = T & DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>>
type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = (T & DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }>)
interface _GlobalComponents {
      'EventoFormModal': typeof import("../components/EventoFormModal.vue")['default']
    'ExcesoCupoDialog': typeof import("../components/ExcesoCupoDialog.vue")['default']
    'PerfilColorCampo': typeof import("../components/PerfilColorCampo.vue")['default']
    'ShiftCalendarMonth': typeof import("../components/ShiftCalendarMonth.vue")['default']
    'ShiftChatPanel': typeof import("../components/ShiftChatPanel.vue")['default']
    'ShiftConfirmDialog': typeof import("../components/ShiftConfirmDialog.vue")['default']
    'ShiftMoverEventoDialog': typeof import("../components/ShiftMoverEventoDialog.vue")['default']
    'AdminNav': typeof import("../components/admin/AdminNav.vue")['default']
    'AdminShell': typeof import("../components/admin/AdminShell.vue")['default']
    'AdminSiNoSwitch': typeof import("../components/admin/AdminSiNoSwitch.vue")['default']
    'AdminFuncionesAdmin': typeof import("../components/admin/FuncionesAdmin.vue")['default']
    'AdminFuncionesServicioAdmin': typeof import("../components/admin/FuncionesServicioAdmin.vue")['default']
    'AdminReglasEventoServicio': typeof import("../components/admin/ReglasEventoServicio.vue")['default']
    'AdminServiciosAdmin': typeof import("../components/admin/ServiciosAdmin.vue")['default']
    'AdminSimpleCatalogCrud': typeof import("../components/admin/SimpleCatalogCrud.vue")['default']
    'AdminTiposEventoAdmin': typeof import("../components/admin/TiposEventoAdmin.vue")['default']
    'NuxtWelcome': typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
    'NuxtLayout': typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
    'NuxtErrorBoundary': typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
    'ClientOnly': typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
    'DevOnly': typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
    'ServerPlaceholder': typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'NuxtLink': typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
    'NuxtLoadingIndicator': typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
    'NuxtTime': typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
    'NuxtImg': typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
    'NuxtPicture': typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
    'NuxtPage': typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
    'NoScript': typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
    'Link': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
    'Base': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
    'Title': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
    'Meta': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
    'Style': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
    'Head': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
    'Html': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
    'Body': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
    'NuxtIsland': typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
      'LazyEventoFormModal': LazyComponent<typeof import("../components/EventoFormModal.vue")['default']>
    'LazyExcesoCupoDialog': LazyComponent<typeof import("../components/ExcesoCupoDialog.vue")['default']>
    'LazyPerfilColorCampo': LazyComponent<typeof import("../components/PerfilColorCampo.vue")['default']>
    'LazyShiftCalendarMonth': LazyComponent<typeof import("../components/ShiftCalendarMonth.vue")['default']>
    'LazyShiftChatPanel': LazyComponent<typeof import("../components/ShiftChatPanel.vue")['default']>
    'LazyShiftConfirmDialog': LazyComponent<typeof import("../components/ShiftConfirmDialog.vue")['default']>
    'LazyShiftMoverEventoDialog': LazyComponent<typeof import("../components/ShiftMoverEventoDialog.vue")['default']>
    'LazyAdminNav': LazyComponent<typeof import("../components/admin/AdminNav.vue")['default']>
    'LazyAdminShell': LazyComponent<typeof import("../components/admin/AdminShell.vue")['default']>
    'LazyAdminSiNoSwitch': LazyComponent<typeof import("../components/admin/AdminSiNoSwitch.vue")['default']>
    'LazyAdminFuncionesAdmin': LazyComponent<typeof import("../components/admin/FuncionesAdmin.vue")['default']>
    'LazyAdminFuncionesServicioAdmin': LazyComponent<typeof import("../components/admin/FuncionesServicioAdmin.vue")['default']>
    'LazyAdminReglasEventoServicio': LazyComponent<typeof import("../components/admin/ReglasEventoServicio.vue")['default']>
    'LazyAdminServiciosAdmin': LazyComponent<typeof import("../components/admin/ServiciosAdmin.vue")['default']>
    'LazyAdminSimpleCatalogCrud': LazyComponent<typeof import("../components/admin/SimpleCatalogCrud.vue")['default']>
    'LazyAdminTiposEventoAdmin': LazyComponent<typeof import("../components/admin/TiposEventoAdmin.vue")['default']>
    'LazyNuxtWelcome': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
    'LazyNuxtLayout': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
    'LazyNuxtErrorBoundary': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
    'LazyClientOnly': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
    'LazyDevOnly': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
    'LazyServerPlaceholder': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyNuxtLink': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
    'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
    'LazyNuxtTime': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
    'LazyNuxtImg': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
    'LazyNuxtPicture': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
    'LazyNuxtPage': LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
    'LazyNoScript': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
    'LazyLink': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
    'LazyBase': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
    'LazyTitle': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
    'LazyMeta': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
    'LazyStyle': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
    'LazyHead': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
    'LazyHtml': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
    'LazyBody': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
    'LazyNuxtIsland': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export const EventoFormModal: typeof import("../components/EventoFormModal.vue")['default']
export const ExcesoCupoDialog: typeof import("../components/ExcesoCupoDialog.vue")['default']
export const PerfilColorCampo: typeof import("../components/PerfilColorCampo.vue")['default']
export const ShiftCalendarMonth: typeof import("../components/ShiftCalendarMonth.vue")['default']
export const ShiftChatPanel: typeof import("../components/ShiftChatPanel.vue")['default']
export const ShiftConfirmDialog: typeof import("../components/ShiftConfirmDialog.vue")['default']
export const ShiftMoverEventoDialog: typeof import("../components/ShiftMoverEventoDialog.vue")['default']
export const AdminNav: typeof import("../components/admin/AdminNav.vue")['default']
export const AdminShell: typeof import("../components/admin/AdminShell.vue")['default']
export const AdminSiNoSwitch: typeof import("../components/admin/AdminSiNoSwitch.vue")['default']
export const AdminFuncionesAdmin: typeof import("../components/admin/FuncionesAdmin.vue")['default']
export const AdminFuncionesServicioAdmin: typeof import("../components/admin/FuncionesServicioAdmin.vue")['default']
export const AdminReglasEventoServicio: typeof import("../components/admin/ReglasEventoServicio.vue")['default']
export const AdminServiciosAdmin: typeof import("../components/admin/ServiciosAdmin.vue")['default']
export const AdminSimpleCatalogCrud: typeof import("../components/admin/SimpleCatalogCrud.vue")['default']
export const AdminTiposEventoAdmin: typeof import("../components/admin/TiposEventoAdmin.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const LazyEventoFormModal: LazyComponent<typeof import("../components/EventoFormModal.vue")['default']>
export const LazyExcesoCupoDialog: LazyComponent<typeof import("../components/ExcesoCupoDialog.vue")['default']>
export const LazyPerfilColorCampo: LazyComponent<typeof import("../components/PerfilColorCampo.vue")['default']>
export const LazyShiftCalendarMonth: LazyComponent<typeof import("../components/ShiftCalendarMonth.vue")['default']>
export const LazyShiftChatPanel: LazyComponent<typeof import("../components/ShiftChatPanel.vue")['default']>
export const LazyShiftConfirmDialog: LazyComponent<typeof import("../components/ShiftConfirmDialog.vue")['default']>
export const LazyShiftMoverEventoDialog: LazyComponent<typeof import("../components/ShiftMoverEventoDialog.vue")['default']>
export const LazyAdminNav: LazyComponent<typeof import("../components/admin/AdminNav.vue")['default']>
export const LazyAdminShell: LazyComponent<typeof import("../components/admin/AdminShell.vue")['default']>
export const LazyAdminSiNoSwitch: LazyComponent<typeof import("../components/admin/AdminSiNoSwitch.vue")['default']>
export const LazyAdminFuncionesAdmin: LazyComponent<typeof import("../components/admin/FuncionesAdmin.vue")['default']>
export const LazyAdminFuncionesServicioAdmin: LazyComponent<typeof import("../components/admin/FuncionesServicioAdmin.vue")['default']>
export const LazyAdminReglasEventoServicio: LazyComponent<typeof import("../components/admin/ReglasEventoServicio.vue")['default']>
export const LazyAdminServiciosAdmin: LazyComponent<typeof import("../components/admin/ServiciosAdmin.vue")['default']>
export const LazyAdminSimpleCatalogCrud: LazyComponent<typeof import("../components/admin/SimpleCatalogCrud.vue")['default']>
export const LazyAdminTiposEventoAdmin: LazyComponent<typeof import("../components/admin/TiposEventoAdmin.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>

export const componentNames: string[]

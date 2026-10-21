import { createBrowserRouter } from 'react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { ProtectedRoute } from './ProtectedRoute'

// Mapa de endereços → telas.
// Rotas aninhadas ("children") aparecem dentro do <Outlet /> do pai:
// ProtectedRoute verifica o login → AppLayout desenha menu e cabeçalho
// → a página da rota aparece no meio.
//
// "lazy": o código da página só é baixado quando alguém a abre pela
// primeira vez (login e dashboard já vêm no carregamento inicial).
export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    Component: ProtectedRoute,
    errorElement: <RouteErrorPage />,
    children: [
      {
        Component: AppLayout,
        children: [
          { index: true, Component: DashboardPage },
          {
            path: 'clientes',
            lazy: () => import('../pages/ClientsPage').then((m) => ({ Component: m.ClientsPage })),
          },
          {
            path: 'clientes/:id',
            lazy: () => import('../pages/ClientDetailPage').then((m) => ({ Component: m.ClientDetailPage })),
          },
          {
            path: 'projetos',
            lazy: () => import('../pages/ProjectsPage').then((m) => ({ Component: m.ProjectsPage })),
          },
          {
            path: 'projetos/:id',
            lazy: () => import('../pages/ProjectDetailPage').then((m) => ({ Component: m.ProjectDetailPage })),
          },
          {
            path: 'conteudos',
            lazy: () => import('../pages/ContentsPage').then((m) => ({ Component: m.ContentsPage })),
          },
          {
            path: 'conteudos/novo',
            lazy: () => import('../pages/ContentFormPage').then((m) => ({ Component: m.ContentFormPage })),
          },
          {
            path: 'conteudos/:id',
            lazy: () => import('../pages/ContentDetailPage').then((m) => ({ Component: m.ContentDetailPage })),
          },
          {
            path: 'conteudos/:id/editar',
            lazy: () => import('../pages/ContentFormPage').then((m) => ({ Component: m.ContentFormPage })),
          },
          {
            path: 'pipeline',
            lazy: () => import('../pages/PipelinePage').then((m) => ({ Component: m.PipelinePage })),
          },
          {
            path: 'calendario',
            lazy: () => import('../pages/CalendarPage').then((m) => ({ Component: m.CalendarPage })),
          },
          {
            path: 'tarefas',
            lazy: () => import('../pages/TasksPage').then((m) => ({ Component: m.TasksPage })),
          },
          {
            path: 'configuracoes',
            lazy: () => import('../pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
          },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
])

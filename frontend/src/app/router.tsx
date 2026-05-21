// Application routes — public, auth, micro-actions, and app layouts.
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthCallbackPage } from "@/pages/auth-callback/AuthCallbackPage";
import { BreathingPage } from "@/pages/breathing/BreathingPage";
import { ChatPage } from "@/pages/chat/ChatPage";
import { LandingPage } from "@/pages/landing/LandingPage";
import { LoginPage } from "@/pages/login/LoginPage";
import { MeditationPage } from "@/pages/meditation/MeditationPage";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage";
import { NotificationsSettingsPage } from "@/pages/settings/NotificationsSettingsPage";
import { ProfileSettingsPage } from "@/pages/settings/ProfileSettingsPage";
import { SecuritySettingsPage } from "@/pages/settings/SecuritySettingsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ThemeSettingsPage } from "@/pages/settings/ThemeSettingsPage";
import { TasksPage } from "@/pages/tasks/TasksPage";

export const router = createBrowserRouter([
  { element: <PublicLayout />, children: [{ path: "/", element: <LandingPage /> }] },
  { element: <AuthLayout />, children: [{ path: "/login", element: <LoginPage /> }] },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  // Micro-actions (standalone pages, no sidebar)
  { path: "/p/breathing", element: <BreathingPage /> },
  { path: "/p/meditation", element: <MeditationPage /> },
  // App (authenticated, with sidebar)
  { path: "/app", element: <AppLayout />, children: [
    { index: true, element: <Navigate to="/app/chat" replace /> },
    { path: "chat", element: <ChatPage /> },
    { path: "chat/:chatId", element: <ChatPage /> },
    { path: "tasks", element: <TasksPage /> },
    { path: "settings", element: <SettingsPage /> },
    { path: "settings/profile", element: <ProfileSettingsPage /> },
    { path: "settings/theme", element: <ThemeSettingsPage /> },
    { path: "settings/security", element: <SecuritySettingsPage /> },
    { path: "settings/notifications", element: <NotificationsSettingsPage /> },
  ]},
  { path: "*", element: <NotFoundPage /> },
]);

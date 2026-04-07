import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateKeys from "./pages/CreateKeys";
import ManageKeys from "./pages/ManageKeys";
import Users from "./pages/Users";
import Packages from "./pages/Packages";
import History from "./pages/History";
import Profile from "./pages/Profile";
import AppLogin from "./pages/AppLogin";
import Settings from "./pages/Settings";
import Verify2FA from "./pages/Verify2FA";

function Router() {
  return (
    <Switch>
      {/* Redireciona raiz para login */}
      <Route path="/">
        <Redirect to="/login" />
      </Route>

      {/* Auth */}
      <Route path="/login" component={Login} />

      {/* Painel Admin */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/keys/create" component={CreateKeys} />
      <Route path="/keys" component={ManageKeys} />
      <Route path="/users" component={Users} />
      <Route path="/packages" component={Packages} />
      <Route path="/history" component={History} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/verify-2fa" component={Verify2FA} />

      {/* Tela iOS */}
      <Route path="/app" component={AppLogin} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <PWAInstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

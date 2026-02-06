import { Route, Switch } from "wouter";
import { Landing } from "./pages/Landing";
import { HostEnvironment } from "./pages/HostEnvironment";
import { HostDisplay } from "./pages/HostDisplay";
import { Join } from "./pages/Join";
import { CharacterSelect } from "./pages/CharacterSelect";
import { Battle } from "./pages/Battle";
import { CharacterGallery } from "./pages/CharacterGallery";
import { CharacterCreate } from "./pages/CharacterCreate";
import { CharacterEdit } from "./pages/CharacterEdit";

export function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/host/environment" component={HostEnvironment} />
        <Route path="/host/:roomId" component={HostDisplay} />
        <Route path="/join" component={Join} />
        <Route path="/play/:roomId/select" component={CharacterSelect} />
        <Route path="/play/:roomId" component={Battle} />
        <Route path="/characters" component={CharacterGallery} />
        <Route path="/characters/create" component={CharacterCreate} />
        <Route path="/characters/:id/edit" component={CharacterEdit} />
        <Route>
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-xl">404 — Page not found</p>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

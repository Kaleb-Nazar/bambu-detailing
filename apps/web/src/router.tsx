import { createBrowserRouter } from "react-router";
import { ErrorPage } from "./routes/error-page";
import { Landing, landingLoader } from "./routes/landing";
import { NewService, newServiceAction, newServiceLoader } from "./routes/new-service";
import { PanelLayout } from "./routes/panel-layout";
import { Purchases, purchasesAction, purchasesLoader } from "./routes/purchases";
import { Report, reportLoader } from "./routes/report";
import { Today, todayAction, todayLoader } from "./routes/today";

// Like routes/web.php: every URL with its "controller".
// loader = what the page reads (GET); action = what a form sends (POST).
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
    loader: landingLoader,
    errorElement: <ErrorPage />,
  },
  {
    path: "/panel",
    element: <PanelLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Today />, loader: todayLoader, action: todayAction },
      {
        path: "registrar",
        element: <NewService />,
        loader: newServiceLoader,
        action: newServiceAction,
      },
      {
        path: "compras",
        element: <Purchases />,
        loader: purchasesLoader,
        action: purchasesAction,
      },
      { path: "reporte", element: <Report />, loader: reportLoader },
    ],
  },
]);

/// <reference types="vinxi/types/client" />

import { StrictMode } from "react";
import { createRouter } from "@/router";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start";

const router = createRouter();

hydrateRoot(
  document,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>
);

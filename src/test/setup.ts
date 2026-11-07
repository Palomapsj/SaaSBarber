import { beforeEach } from "vitest";
import { installMockApi, resetMockApi } from "./mockApi";

installMockApi();
beforeEach(() => {
  resetMockApi();
});

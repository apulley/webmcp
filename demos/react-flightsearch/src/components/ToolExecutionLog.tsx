/**
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLayoutEffect, useState } from "react";
import {
  TOOL_EXECUTION_EVENT,
  TOOL_REGISTRATION_EVENT,
  isModelContextAvailable,
  type ToolExecutionLogEntry,
  type ToolRegistrationLogEntry,
} from "../webmcp";

const MAX_LOG_ENTRIES = 20;

export default function ToolExecutionLog() {
  const [entries, setEntries] = useState<ToolExecutionLogEntry[]>([]);
  const [registrations, setRegistrations] = useState<
    Record<string, ToolRegistrationLogEntry>
  >({});

  useLayoutEffect(() => {
    const handleToolExecution = (event: Event) => {
      const entry = (event as CustomEvent<ToolExecutionLogEntry>).detail;
      setEntries((currentEntries) =>
        [entry, ...currentEntries].slice(0, MAX_LOG_ENTRIES),
      );
    };
    const handleToolRegistration = (event: Event) => {
      const entry = (event as CustomEvent<ToolRegistrationLogEntry>).detail;
      setRegistrations((currentRegistrations) => ({
        ...currentRegistrations,
        [entry.toolName]: entry,
      }));
    };

    window.addEventListener(TOOL_EXECUTION_EVENT, handleToolExecution);
    window.addEventListener(TOOL_REGISTRATION_EVENT, handleToolRegistration);
    return () => {
      window.removeEventListener(TOOL_EXECUTION_EVENT, handleToolExecution);
      window.removeEventListener(
        TOOL_REGISTRATION_EVENT,
        handleToolRegistration,
      );
    };
  }, []);

  const registrationEntries = Object.values(registrations);
  const apiAvailable = registrationEntries.length
    ? registrationEntries[0].apiAvailable
    : isModelContextAvailable();

  return (
    <aside className="tool-execution-log">
      <strong className="tool-execution-log-title">WebMCP status</strong>
      <div
        className={`tool-execution-log-api ${apiAvailable ? "available" : "unavailable"}`}
      >
        document.modelContext: {apiAvailable ? "available" : "unavailable"}
      </div>
      <ul className="tool-execution-log-list">
        {registrationEntries.length === 0 ? (
          <li className="tool-execution-log-empty">
            Checking tool registration…
          </li>
        ) : (
          registrationEntries.map((entry) => {
            const state = !entry.enabled
              ? "disabled"
              : !entry.apiAvailable
                ? "API unavailable"
                : entry.error
                  ? "registration failed"
                  : entry.registered
                    ? "registered"
                    : "registering";
            const statusClass = !entry.enabled
              ? "disabled"
              : entry.error || !entry.apiAvailable
                ? "failed"
                : entry.registered
                  ? "succeeded"
                  : "started";

            return (
              <li
                className={`tool-execution-log-registration tool-execution-log-${statusClass}`}
                key={entry.toolName}
              >
                <strong>{entry.toolName}</strong>: {state}
                {entry.error ? ` — ${entry.error}` : ""}
              </li>
            );
          })
        )}
      </ul>
      <strong className="tool-execution-log-title">Recent tool calls</strong>
      {entries.length === 0 ? (
        <div className="tool-execution-log-empty">No tool calls yet</div>
      ) : (
        <ul className="tool-execution-log-list">
          {entries.map((entry) => (
            <li
              className={`tool-execution-log-entry tool-execution-log-${entry.status}`}
              key={entry.id}
            >
              <span>
                {new Date(entry.timestamp).toLocaleTimeString()}{" "}
                <strong>{entry.toolName}</strong>: {entry.status}
                {entry.error ? ` — ${entry.error}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

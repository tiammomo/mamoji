import { API_BASE, api } from "../api.client";
import type { BackupImportResponse, BackupStatus } from "../api.types";

export const backupApi = {
  exportData: () => {
    const token = localStorage.getItem("token");
    window.open(`${API_BASE}/backup/export?token=${token}`, "_blank");
  },
  importData: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/backup/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    }).then((res) => res.json() as Promise<BackupImportResponse>);
  },
  getStatus: () => api.get<BackupStatus>("/backup/status"),
};

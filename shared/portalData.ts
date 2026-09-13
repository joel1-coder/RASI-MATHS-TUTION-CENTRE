export type AttendanceStatus = "present" | "late" | "absent";

export function summarizeAttendance(records: Array<{ status: string }>) {
  const present = records.filter(record => record.status === "present").length;
  const late = records.filter(record => record.status === "late").length;
  const absent = records.filter(record => record.status === "absent").length;
  return {
    present,
    late,
    absent,
    total: records.length,
    percentage: records.length ? Math.round((present / records.length) * 100) : 0,
  };
}

export function sortByIsoDate<T extends { attendanceDate?: string; sessionDate?: string }>(records: T[], descending = false) {
  return records.slice().sort((a, b) => {
    const aDate = a.attendanceDate ?? a.sessionDate ?? "";
    const bDate = b.attendanceDate ?? b.sessionDate ?? "";
    return descending ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate);
  });
}

export function parseAttendanceCsv(csv: string, defaultStudentEmail: string) {
  const lines = csv.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const rows = lines[0]?.toLowerCase().includes("date") ? lines.slice(1) : lines;
  return rows.map(line => {
    const [date, status, email] = line.split(",").map(value => value.trim());
    return { studentEmail: email || defaultStudentEmail, attendanceDate: date, status: status?.toLowerCase() as AttendanceStatus };
  }).filter(record => /^\d{4}-\d{2}-\d{2}$/.test(record.attendanceDate) && ["present", "late", "absent"].includes(record.status));
}

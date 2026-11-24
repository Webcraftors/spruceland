// Stage 4/5 E2E: breakdowns, jobs, technician ops, job cards, notifications, inventory, client store.
// Context file (E2E_CTX) is produced by a setup step that creates temporary users:
// M=STGL Admin, T1/T2=STGL Technicians, A=Yalelo Client Admin, S=Yalelo Store Manager, B=Pick n Pay Client Admin.
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const ctx = JSON.parse(fs.readFileSync(process.env.E2E_CTX ?? "/tmp/e2e/ctx.json", "utf8"));
const URL = process.env.SUPABASE_URL!, PK = process.env.SUPABASE_PUBLISHABLE_KEY!, SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cl = (k: string) => createClient(URL, PK, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${ctx.users[k].token}` } } });
const M = cl("M"), T1 = cl("T1"), T2 = cl("T2"), A = cl("A"), S = cl("S"), B = cl("B");
const anon = createClient(URL, PK, { auth: { persistSession: false } });
const admin = createClient(URL, SR, { auth: { persistSession: false } });
const Y = ctx.orgs["yalelo"], P = ctx.orgs["pick-n-pay"];
let pass = 0, fail = 0; const failures: string[] = [];
const ok = (n: string, c: boolean, d?: any) => { c ? pass++ : (fail++, failures.push(n)); console.log(c ? "PASS" : "FAIL", n, c ? "" : JSON.stringify(d)?.slice(0, 300)); };
const den = (r: any) => !!r.error;
const sfx = Date.now().toString().slice(-6);
let r: any;

// ---------- fixtures (via client admin A, Stage 3 functions) ----------
await A.rpc("save_location_type", { p_organization_id: Y, p_type_code: "store", p_display_name: "Store", p_description: null, p_sort_order: 1, p_status: "active" });
r = await A.rpc("create_location", { p_organization_id: Y, p_name: "E2E Store One " + sfx, p_location_type: "store", p_parent_location_id: null, p_location_code: "E2A" + sfx, p_country: "Zambia", p_province: "Lusaka", p_city: "Lusaka", p_address: null });
const L1 = r.data?.id ?? r.data; ok("fixture location 1", !r.error, r.error);
r = await A.rpc("create_location", { p_organization_id: Y, p_name: "E2E Store Two " + sfx, p_location_type: "store", p_parent_location_id: null, p_location_code: "E2B" + sfx, p_country: "Zambia", p_province: "Copperbelt", p_city: "Ndola", p_address: null });
const L2 = r.data?.id ?? r.data;
r = await A.rpc("save_equipment_category", { p_organization_id: Y, p_category_code: "e2e45_scales", p_display_name: "E2E Scales", p_description: null, p_sort_order: 1, p_status: "active" });
const cat = r.data?.id ?? r.data;
r = await A.rpc("save_equipment_type", { p_organization_id: Y, p_category_id: cat, p_type_code: "e2e45_platform", p_display_name: "E2E Platform", p_description: null, p_sort_order: 1, p_status: "active" });
const typ = r.data?.id ?? r.data;
r = await A.rpc("register_equipment", { p_actor_organization_id: Y, p_owner_organization_id: Y, p_equipment_type_id: typ, p_equipment_name: "E2E Platform Scale", p_location_id: L1, p_model_id: null, p_asset_tag: "E45-" + sfx, p_serial_number: "SN45-" + sfx, p_description: null, p_reason: "e2e" });
const EQ = r.data?.id ?? r.data?.equipment?.id ?? r.data; ok("fixture equipment", !r.error, r.error);
r = await admin.from("member_locations").insert({ organization_id: Y, member_id: ctx.users.S.member_id, location_id: L1 }); ok("fixture store manager scoped to store 1", !r.error, r.error);

// ---------- 9.1 breakdown reporting ----------
r = await S.rpc("report_breakdown", { p_organization_id: Y, p_location_id: L1, p_equipment_id: EQ, p_fault_description: "Scale not zeroing after power cut", p_fault_category: "calibration", p_priority: "high", p_client_request_key: "k1-" + sfx });
const BD = r.data; ok("store manager reports breakdown at own store", !r.error && BD?.reference?.startsWith("BD-") && BD.status === "reported", r.error ?? r.data);
r = await S.rpc("report_breakdown", { p_organization_id: Y, p_location_id: L1, p_equipment_id: EQ, p_fault_description: "Scale not zeroing after power cut", p_client_request_key: "k1-" + sfx });
ok("same request key returns existing (no duplicate)", r.data?.duplicate === true && r.data?.id === BD.id, r.data);
r = await S.rpc("report_breakdown", { p_organization_id: Y, p_location_id: L1, p_equipment_id: EQ, p_fault_description: "scale not zeroing after power cut " });
ok("identical fault within 10 min treated as duplicate", r.data?.duplicate === true, r.data);
r = await S.rpc("report_breakdown", { p_organization_id: Y, p_location_id: L2, p_equipment_id: null, p_fault_description: "Printer jam at other store" });
ok("store manager cannot report for another store", den(r), r.data);
r = await B.rpc("report_breakdown", { p_organization_id: Y, p_location_id: L1, p_equipment_id: null, p_fault_description: "Cross tenant attempt" });
ok("other client cannot report for Yalelo", den(r), r.data);
r = await anon.rpc("report_breakdown", { p_organization_id: Y, p_location_id: L1, p_equipment_id: null, p_fault_description: "anon attempt" });
ok("anonymous denied", den(r), r.data);
r = await S.rpc("report_breakdown", { p_organization_id: Y, p_location_id: L1, p_equipment_id: null, p_fault_description: "abc" });
ok("too-short description rejected", den(r), r.data);
r = await M.rpc("report_breakdown", { p_organization_id: Y, p_location_id: L2, p_equipment_id: null, p_fault_description: "Logged by phone: label printer fault", p_channel: "phone", p_contact_name: "Store Supervisor", p_contact_phone: "+260970000000" });
const BD2 = r.data; ok("STGL logs phone breakdown (no equipment)", !r.error && BD2.channel === "phone" && BD2.equipment_id === null, r.error ?? r.data);
r = await S.rpc("get_breakdown_email_draft", { p_breakdown_id: BD.id });
ok("email draft prepared, not marked sent", !r.error && r.data?.status === "prepared" && r.data?.delivery_confirmed === false && r.data?.body.includes(BD.reference) && r.data?.mailto.startsWith("mailto:"), r.error ?? r.data);
r = await B.rpc("get_breakdown_email_draft", { p_breakdown_id: BD.id }); ok("other client cannot read draft", den(r), r.data);

// ---------- client visibility ----------
r = await S.rpc("list_breakdowns", { p_organization_id: Y });
ok("store manager sees own store only", !r.error && r.data.some((b: any) => b.id === BD.id) && !r.data.some((b: any) => b.id === BD2.id), r.error ?? r.data?.map((b: any) => b.reference));
r = await A.rpc("list_breakdowns", { p_organization_id: Y });
ok("client admin sees all Yalelo stores", !r.error && r.data.some((b: any) => b.id === BD.id) && r.data.some((b: any) => b.id === BD2.id), r.error);
r = await B.rpc("list_breakdowns", { p_organization_id: Y }); ok("other client cannot list Yalelo", den(r), r.data);
r = await M.rpc("list_breakdowns", {}); ok("STGL manager sees all incoming", !r.error && r.data.some((b: any) => b.id === BD.id), r.error);
r = await T1.rpc("update_breakdown", { p_breakdown_id: BD.id, p_action: "escalate", p_reason: "x" }); ok("technician cannot escalate", den(r), r.data);
r = await M.rpc("update_breakdown", { p_breakdown_id: BD.id, p_action: "escalate", p_reason: "Store cannot trade" });
ok("manager escalates (priority stays high)", !r.error && r.data.escalated_at && r.data.priority === "high", r.error ?? r.data);
r = await A.from("breakdowns").select("*"); ok("direct table read blocked", den(r) || r.data?.length === 0, r.data);

// ---------- 9.3/9.4 jobs ----------
r = await M.rpc("create_job", { p_organization_id: null, p_description: null, p_breakdown_id: BD.id, p_internal_notes: "Customer owes invoice — internal" });
const J = r.data; ok("job created from breakdown inherits details", !r.error && J.status === "open" && J.location_id === L1 && J.equipment_id === EQ && J.priority === "high", r.error ?? r.data);
r = await M.rpc("create_job", { p_organization_id: null, p_description: null, p_breakdown_id: BD.id }); ok("second active job for same breakdown blocked", den(r), r.data);
r = await S.rpc("list_breakdowns", { p_organization_id: Y }); const sb = r.data?.find((b: any) => b.id === BD.id);
ok("breakdown status derived from job (open)", sb?.status === "open" && sb?.latest_job?.reference === J.reference, sb);
r = await T1.rpc("list_jobs", { p_view: "available" }); ok("technician sees available job", r.data?.some((j: any) => j.id === J.id), r.error ?? r.data);
r = await A.rpc("create_job", { p_organization_id: Y, p_description: "client tries" }); ok("client cannot create jobs", den(r), r.data);
// concurrent pickup
const [p1, p2] = await Promise.all([T1.rpc("pickup_job", { p_job_id: J.id }), T2.rpc("pickup_job", { p_job_id: J.id })]);
const winners = [p1, p2].filter((x) => !x.error); const WIN = !p1.error ? T1 : T2, LOSE = !p1.error ? T2 : T1;
ok("simultaneous pickup: exactly one technician wins", winners.length === 1 && winners[0].data.status === "accepted", [p1.error?.message, p2.error?.message]);
r = await LOSE.rpc("transition_job", { p_job_id: J.id, p_action: "en_route" }); ok("non-assigned technician cannot act", den(r), r.data);
r = await WIN.rpc("transition_job", { p_job_id: J.id, p_action: "return", p_reason: "" }); ok("return requires reason", den(r), r.data);
r = await WIN.rpc("transition_job", { p_job_id: J.id, p_action: "return", p_reason: "Vehicle breakdown" }); ok("unstarted job returned to queue", r.data?.status === "open" && r.data?.assigned_technician_id === null, r.error ?? r.data);
r = await M.rpc("assign_job", { p_job_id: J.id, p_technician_id: ctx.users.T1.id, p_scheduled_for: new Date(Date.now() - 864e5).toISOString().slice(0, 10) });
ok("manager assigns technician", r.data?.status === "assigned" && r.data?.assigned_technician_id === ctx.users.T1.id, r.error ?? r.data);
r = await M.rpc("assign_job", { p_job_id: J.id, p_technician_id: ctx.users.A.id }); ok("cannot assign a non-technician", den(r), r.data);
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "decline", p_reason: "On leave" }); ok("technician declines with reason", r.data?.status === "open", r.error ?? r.data);
r = await M.rpc("assign_job", { p_job_id: J.id, p_technician_id: ctx.users.T2.id }); ok("reassign to second technician", r.data?.status === "assigned", r.error);
r = await M.rpc("assign_job", { p_job_id: J.id, p_technician_id: ctx.users.T1.id }); ok("reassign back to first technician", r.data?.assigned_technician_id === ctx.users.T1.id, r.error);
r = await T2.rpc("list_my_notifications", {}); ok("previous technician notified of reassignment", r.data?.items?.some((n: any) => n.notification_type === "job.reassigned" && n.entity_id === J.id), r.data);
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "start" }); ok("cannot start before accepting", den(r), r.data);
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "accept" }); ok("technician accepts", r.data?.status === "accepted" && r.data?.accepted_at, r.error);
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "en_route" }); ok("en route", r.data?.status === "en_route" && r.data?.en_route_at, r.error);
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "start" }); ok("arrived / in progress", r.data?.status === "in_progress" && r.data?.started_at, r.error);
const firstStart = r.data?.started_at;
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "hold" }); ok("hold requires reason", den(r), r.data);
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "hold", p_reason: "Waiting for load cell" }); ok("put on hold", r.data?.status === "on_hold" && r.data?.hold_reason, r.error);
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "resume" }); ok("resume keeps original start time", r.data?.status === "in_progress" && r.data?.started_at === firstStart, r.data);
// client view
r = await S.rpc("get_job", { p_job_id: J.id });
ok("client sees job status + technician, not internal notes", !r.error && r.data.status === "in_progress" && r.data.technician_name === "E2E Tech One" && !("internal_notes" in r.data), r.error ?? Object.keys(r.data ?? {}));
r = await B.rpc("get_job", { p_job_id: J.id }); ok("other client cannot read job", den(r), r.data);
r = await S.rpc("list_my_notifications", {}); ok("client notified of en-route and on-site", ["job.en_route", "job.started"].every((t) => r.data?.items?.some((n: any) => n.notification_type === t && n.entity_id === J.id)), r.data?.items?.map((n: any) => n.notification_type));
r = await M.rpc("list_jobs", { p_overdue_only: true }); ok("overdue job listed for management", r.data?.some((j: any) => j.id === J.id && j.is_overdue), r.error);

// ---------- 9.6 / 13 completion + job cards ----------
r = await T1.rpc("complete_job", { p_job_id: J.id, p_fault_identified: "", p_work_carried_out: "x", p_repair_outcome: "fully_resolved", p_signature_method: "none" });
ok("completion requires fault identified", den(r), r.data);
r = await T1.rpc("complete_job", { p_job_id: J.id, p_fault_identified: "Load cell damaged", p_work_carried_out: "Temporary recalibration", p_repair_outcome: "partially_resolved", p_signature_method: "physical", p_physical_card_reference: "PJC-1001" });
ok("partial repair -> job on hold for follow-up, card created", r.data?.job?.status === "on_hold" && r.data?.job?.repair_outcome === "partially_resolved" && r.data?.job_card?.reference?.startsWith("JC-"), r.error ?? r.data);
const C1 = r.data?.job_card;
r = await admin.from("job_cards").update({ work_carried_out: "tampered" }).eq("id", C1.id); ok("finalized job card cannot be modified (even by backend)", den(r), r);
r = await T1.rpc("transition_job", { p_job_id: J.id, p_action: "resume" }); ok("return visit resumes job", r.data?.status === "in_progress", r.error);
r = await T1.rpc("complete_job", { p_job_id: J.id, p_fault_identified: "Load cell damaged", p_work_carried_out: "Replaced load cell", p_repair_outcome: "fully_resolved", p_signature_method: "digital", p_client_representative_name: "Mary Banda" });
ok("digital signature requires signature data", den(r), r.data);
r = await T1.rpc("complete_job", { p_job_id: J.id, p_fault_identified: "Load cell damaged", p_work_carried_out: "Replaced load cell and calibrated", p_repair_outcome: "fully_resolved", p_signature_method: "digital", p_client_representative_name: "Mary Banda", p_signature_data: "data:image/png;base64,iVBORw0KGgo=" });
ok("fully resolved -> job closed with signed card", r.data?.job?.status === "closed" && r.data?.job_card?.signature_method === "digital", r.error ?? r.data);
const C2 = r.data?.job_card;
r = await S.rpc("get_job_card", { p_job_card_id: C2.id }); ok("client reads completed job card with snapshot", !r.error && r.data.snapshot?.client?.name === "Yalelo" && r.data.snapshot?.equipment?.serial_number === "SN45-" + sfx, r.error ?? r.data?.snapshot);
r = await B.rpc("get_job_card", { p_job_card_id: C2.id }); ok("other client cannot read job card", den(r), r.data);
r = await S.rpc("list_breakdowns", { p_organization_id: Y }); ok("breakdown shows closed", r.data?.find((b: any) => b.id === BD.id)?.status === "closed", r.data);
r = await T1.rpc("correct_job_card", { p_job_card_id: C2.id, p_correction_reason: "Fix typo in work" }); ok("technician cannot correct card", den(r), r.data);
r = await M.rpc("correct_job_card", { p_job_card_id: C2.id, p_correction_reason: "Add serial of new load cell", p_work_carried_out: "Replaced load cell (S/N LC-77) and calibrated" });
ok("manager issues revision 2 (same reference)", r.data?.revision === 2 && r.data?.reference === C2.reference, r.error ?? r.data);
r = await M.rpc("get_job", { p_job_id: J.id }); ok("job history: events + 3 cards, original marked superseded", r.data?.events?.length >= 10 && r.data?.job_cards?.length === 3 && r.data.job_cards.some((c: any) => c.id === C2.id && c.is_superseded), { e: r.data?.events?.length, c: r.data?.job_cards?.length });
r = await M.rpc("manage_job", { p_job_id: J.id, p_action: "reopen", p_reason: "Fault recurred" }); ok("manager reopens closed job", r.data?.status === "open" && r.data?.assigned_technician_id === null, r.error);
r = await M.rpc("manage_job", { p_job_id: J.id, p_action: "cancel", p_reason: "Duplicate of new call" }); ok("manager cancels", r.data?.status === "cancelled", r.error);
// unresolved closed by management keeps outcome
r = await M.rpc("create_job", { p_organization_id: null, p_description: null, p_breakdown_id: BD2.id, p_technician_id: ctx.users.T2.id });
const J2 = r.data; ok("job created with direct assignment", J2?.status === "assigned", r.error);
await T2.rpc("transition_job", { p_job_id: J2.id, p_action: "accept" }); await T2.rpc("transition_job", { p_job_id: J2.id, p_action: "start" });
r = await T2.rpc("complete_job", { p_job_id: J2.id, p_fault_identified: "Printer mainboard failed", p_work_carried_out: "Diagnosed only", p_repair_outcome: "not_resolved", p_signature_method: "none", p_no_signature_reason: "Supervisor unavailable" });
ok("no-signature completion allowed", r.data?.job?.status === "on_hold" && r.data?.job_card?.signature_method === "none", r.error);
r = await M.rpc("manage_job", { p_job_id: J2.id, p_action: "close", p_reason: "Client replacing printer" });
ok("management close keeps 'not resolved' outcome + reason", r.data?.status === "closed" && r.data?.repair_outcome === "not_resolved" && r.data?.close_reason, r.data);
r = await M.rpc("job_dashboard_summary", {}); ok("dashboard summary", !r.error && typeof r.data.overdue === "number" && r.data.by_status, r.error);
r = await T1.rpc("job_dashboard_summary", {}); ok("technician cannot read management summary", den(r), r.data);
r = await T1.rpc("technician_home", {}); ok("technician home counts", !r.error && r.data.completed_30d >= 2, r.error ?? r.data);
r = await T1.rpc("set_technician_availability", { p_status: "busy" }); ok("technician availability", r.data?.status === "busy", r.error);
r = await A.rpc("technician_home", {}); ok("client cannot use technician home", den(r), r.data);

// ---------- notifications ----------
r = await M.rpc("list_my_notifications", {}); ok("manager got new-breakdown notice; own escalation not self-notified", r.data?.items?.some((n: any) => n.notification_type === "breakdown.reported" && n.entity_id === BD.id) && !r.data?.items?.some((n: any) => n.notification_type === "breakdown.escalated"), r.data?.items?.map((n: any) => n.notification_type));
r = await B.rpc("list_my_notifications", {}); ok("other client received no Yalelo notifications", r.data?.items?.every((n: any) => n.organization_id !== Y), r.data);
r = await S.rpc("list_my_notifications", {}); const nid = r.data?.items?.[0]?.id;
r = await B.rpc("mark_notification_read", { p_notification_id: nid }); ok("cannot mark someone else's notification", r.data === false, r);
r = await S.rpc("mark_notification_read", { p_notification_id: nid }); ok("mark one read", r.data === true, r);
r = await S.rpc("mark_all_notifications_read", {}); r = await S.rpc("list_my_notifications", {}); ok("mark all read", r.data?.unread_count === 0, r.data?.unread_count);
r = await A.rpc("save_notification_setting", { p_event_type: "breakdown.reported", p_in_app: true, p_push: true, p_email: true, p_email_recipients: ["x@example.com"] }); ok("client cannot change STGL notification settings", den(r), r.data);
r = await M.rpc("save_notification_setting", { p_event_type: "breakdown.reported", p_in_app: true, p_push: true, p_email: true, p_email_recipients: ["bad"] }); ok("invalid email recipient rejected", den(r), r.data);
r = await admin.from("notification_deliveries").select("status,channel").eq("event_type", "breakdown.reported"); ok("push events queued as pending (never marked sent)", r.data?.length > 0 && r.data.every((d: any) => d.status === "pending_provider"), r.error ?? r.data);

// ---------- 10 inventory ----------
r = await A.rpc("save_product", { p_product_id: null, p_sku: "X", p_name: "x", p_category_id: null, p_selling_price: 1 }); ok("client cannot manage inventory", den(r), r.data);
r = await T1.rpc("list_inventory", {}); ok("technician has no inventory access by default", den(r), r.data);
const cats = (await admin.from("product_categories").select("id,code")).data!; const labelCat = cats.find((c: any) => c.code === "label_rolls")!.id;
r = await M.rpc("save_product", { p_product_id: null, p_sku: "e2e-lbl-" + sfx, p_name: "E2E Label Roll 58mm", p_category_id: labelCat, p_selling_price: 85.5, p_cost_price: 40, p_low_stock_threshold: 3, p_is_published: true, p_supplier_reference: "SUP-SECRET", p_internal_notes: "margin note" });
const PR = r.data; ok("create product", !r.error && PR.quantity_on_hand === 0 && PR.sku === ("E2E-LBL-" + sfx), r.error ?? r.data);
r = await M.rpc("record_stock_movement", { p_product_id: PR.id, p_movement_type: "dispatch", p_quantity: 1, p_reason: "test" }); ok("cannot dispatch below zero", den(r), r.data);
r = await M.rpc("record_stock_movement", { p_product_id: PR.id, p_movement_type: "receipt", p_quantity: 10, p_supplier_reference: "GRN-1" }); ok("receive stock", r.data?.on_hand_after === 10, r.error);
r = await M.rpc("record_stock_movement", { p_product_id: PR.id, p_movement_type: "adjustment", p_quantity: -1, p_reason: "" }); ok("adjustment requires reason", den(r), r.data);
r = await M.rpc("record_stock_movement", { p_product_id: PR.id, p_movement_type: "adjustment", p_quantity: -1, p_reason: "Damaged roll" }); ok("adjustment with reason", r.data?.on_hand_after === 9, r.error);
r = await M.from("products").update({ quantity_on_hand: 9999 }).eq("id", PR.id).select(); ok("direct stock overwrite blocked", den(r) || r.data?.length === 0, r.data);
r = await M.rpc("list_inventory", { p_search: PR.sku }); ok("STGL admin sees cost price", r.data?.[0]?.cost_price === 40, r.data?.[0]);

// ---------- 11 client store ----------
r = await A.rpc("list_store_products", { p_organization_id: Y, p_search: PR.sku });
const sp = r.data?.[0]; ok("client sees published product without cost/supplier/notes", !r.error && sp?.selling_price === 85.5 && !("cost_price" in sp) && !("supplier_reference" in sp) && !("internal_notes" in sp) && JSON.stringify(r.data).indexOf("SUP-SECRET") < 0, r.error ?? sp);
r = await S.rpc("list_store_products", { p_organization_id: Y }); ok("store manager has no store access by default", den(r), r.data);
r = await A.rpc("place_store_order", { p_organization_id: Y, p_lines: [{ product_id: PR.id, quantity: 6, unit_price: 0.01 }], p_delivery_location_id: L1, p_purchase_order_reference: "PO-" + sfx, p_client_request_key: "o1-" + sfx });
const O = r.data; ok("order placed with server-side total (client price ignored)", !r.error && Number(O.subtotal) === 513 && O.status === "pending", r.error ?? r.data);
r = await A.rpc("place_store_order", { p_organization_id: Y, p_lines: [{ product_id: PR.id, quantity: 6 }], p_client_request_key: "o1-" + sfx }); ok("duplicate order submission returns existing", r.data?.duplicate === true && r.data?.id === O.id, r.data);
r = await B.rpc("place_store_order", { p_organization_id: Y, p_lines: [{ product_id: PR.id, quantity: 1 }] }); ok("other client cannot order for Yalelo", den(r), r.data);
r = await B.rpc("get_store_order", { p_order_id: O.id }); ok("order history isolated by organization", den(r), r.data);
r = await B.rpc("place_store_order", { p_organization_id: P, p_lines: [{ product_id: PR.id, quantity: 6 }] }); const O2 = r.data; ok("second client orders same product", !r.error, r.error);
await M.rpc("save_product", { p_product_id: PR.id, p_sku: PR.sku, p_name: PR.name, p_category_id: labelCat, p_selling_price: 120, p_cost_price: 40, p_low_stock_threshold: 3, p_is_published: true });
r = await A.rpc("get_store_order", { p_order_id: O.id }); ok("price change does not alter historical order", Number(r.data?.lines?.[0]?.unit_price) === 85.5 && Number(r.data?.subtotal) === 513, r.data);
r = await A.rpc("update_store_order", { p_order_id: O.id, p_action: "confirm" }); ok("client cannot confirm order", den(r), r.data);
r = await M.rpc("update_store_order", { p_order_id: O.id, p_action: "confirm" }); ok("confirm reserves stock", r.data?.status === "confirmed", r.error);
let inv = (await M.rpc("list_inventory", { p_search: PR.sku })).data[0]; ok("reserved 6, available 3", inv.quantity_reserved === 6 && inv.quantity_available === 3, inv);
r = await M.rpc("update_store_order", { p_order_id: O2.id, p_action: "confirm" }); ok("overselling prevented on confirm", den(r), r.data);
r = await M.rpc("record_stock_movement", { p_product_id: PR.id, p_movement_type: "dispatch", p_quantity: 5, p_reason: "manual" }); ok("manual dispatch cannot consume reserved stock", den(r), r.data);
r = await M.rpc("update_store_order", { p_order_id: O.id, p_action: "dispatch" }); ok("dispatch deducts stock + releases reservation", r.data?.status === "dispatched", r.error);
inv = (await M.rpc("list_inventory", { p_search: PR.sku })).data[0]; ok("on hand 3, reserved 0", inv.quantity_on_hand === 3 && inv.quantity_reserved === 0, inv);
r = await M.rpc("update_store_order", { p_order_id: O.id, p_action: "dispatch" }); ok("duplicate dispatch rejected", den(r), r.data);
r = await M.rpc("update_store_order", { p_order_id: O.id, p_action: "cancel", p_reason: "late" }); ok("cannot cancel after dispatch", den(r), r.data);
r = await M.rpc("set_store_order_commercial", { p_order_id: O.id, p_payment_status: "invoiced", p_invoice_reference: "INV-" + sfx, p_quotation_reference: "Q-" + sfx }); ok("commercial references + payment status", r.data?.payment_status === "invoiced" && r.data?.status === "dispatched", r.error);
r = await M.rpc("update_store_order", { p_order_id: O.id, p_action: "deliver" }); r = await M.rpc("update_store_order", { p_order_id: O.id, p_action: "complete" }); ok("delivered -> completed", r.data?.status === "completed", r.error);
r = await M.rpc("record_stock_movement", { p_product_id: PR.id, p_movement_type: "receipt", p_quantity: 10 });
r = await M.rpc("update_store_order", { p_order_id: O2.id, p_action: "confirm" }); r = await M.rpc("update_store_order", { p_order_id: O2.id, p_action: "cancel", p_reason: "Client changed mind" });
inv = (await M.rpc("list_inventory", { p_search: PR.sku })).data[0]; ok("cancel releases reservation", r.data?.status === "cancelled" && inv.quantity_reserved === 0 && inv.quantity_on_hand === 13, { s: r.data?.status, inv });
r = await A.rpc("list_my_notifications", {}); ok("client notified of order status changes", r.data?.items?.some((n: any) => n.notification_type === "order.status_changed" && n.entity_id === O.id), r.data?.items?.map((n: any) => n.notification_type));
r = await M.rpc("list_stock_movements", { p_product_id: PR.id }); ok("full movement history", r.data?.length >= 7, r.data?.length);
r = await admin.from("stock_movements").delete().eq("product_id", PR.id); ok("stock movements are append-only", den(r), r);
await M.rpc("save_product", { p_product_id: PR.id, p_sku: PR.sku, p_name: PR.name, p_category_id: labelCat, p_selling_price: 120, p_is_active: false, p_is_published: true });
r = await A.rpc("list_store_products", { p_organization_id: Y, p_search: PR.sku }); ok("inactive product hidden from store", r.data?.length === 0, r.data);
// audit trail is verified with a read-only SQL query after the run (audit_logs has no API grants by design)

console.log(`\n${pass} passed, ${fail} failed`); if (failures.length) console.log("FAILED:", failures.join(" | "));
fs.writeFileSync("/tmp/e2e/fixtures.json", JSON.stringify({ L1, L2, cat, typ, EQ, BD: BD?.id, BD2: BD2?.id, J: J?.id, J2: J2?.id, PR: PR?.id, O: O?.id, O2: O2?.id }));

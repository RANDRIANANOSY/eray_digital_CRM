// Types mirroring the Symfony backend's DTOs 1:1 (src/Dto/{Request,Response}
// and src/Entity/Enum on the backend). Keep these in sync with the backend
// when either side changes shape.

export type ClientStatus = "prospect" | "actif" | "inactif" | "vip";
export type Priority = "low" | "medium" | "high";

export type OpportunityStage =
  | "Nouveau lead"
  | "Premier contact"
  | "Qualification"
  | "Rendez-vous planifié"
  | "Analyse des besoins"
  | "Démonstration"
  | "Devis envoyé"
  | "Négociation"
  | "Relance 1"
  | "Relance 2"
  | "Relance finale"
  | "Contrat signé"
  | "Vente gagnée"
  | "Vente perdue"
  | "Ambassadeur";

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  "Nouveau lead",
  "Premier contact",
  "Qualification",
  "Rendez-vous planifié",
  "Analyse des besoins",
  "Démonstration",
  "Devis envoyé",
  "Négociation",
  "Relance 1",
  "Relance 2",
  "Relance finale",
  "Contrat signé",
  "Vente gagnée",
  "Vente perdue",
  "Ambassadeur",
];

export type ProjectStatus = "En cours" | "En attente" | "Suspendu" | "Terminé";
export type ProjectTaskStatus = "À faire" | "En cours" | "Terminé" | "En retard";
export type ActivityType =
  | "call"
  | "meeting"
  | "email"
  | "quote"
  | "contract"
  | "visit"
  | "note"
  | "follow-up"
  | "task"
  | "whatsapp";
export type ActivityStatus = "planifié" | "terminé" | "en retard" | "à faire";
export type UserRole = "admin" | "manager" | "commercial";
export type UserStatus = "active" | "invited" | "disabled";

export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  phone: string | null;
  team: string | null;
  status: UserStatus;
  isVerified: boolean;
}

export interface ClientDto {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  email: string;
  phone: string;
  city: string | null;
  sector: string | null;
  ownerId: number;
  ownerName: string;
  status: ClientStatus;
  priority: Priority;
  tags: string[];
  value: number;
  lastContactAt: string | null;
  initials: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPayload {
  name: string;
  company?: string | null;
  position?: string | null;
  email: string;
  phone: string;
  city?: string | null;
  sector?: string | null;
  status: ClientStatus;
  priority: Priority;
  tags?: string[];
  value: number;
  ownerId?: number | null;
}

export interface ClientListFilters {
  q?: string;
  status?: ClientStatus[];
  priority?: Priority[];
  sector?: string[];
  tags?: string[];
  owner?: number;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface OpportunityDto {
  id: number;
  clientId: number;
  clientName: string;
  company: string | null;
  ownerId: number;
  ownerName: string;
  amount: number;
  probability: number;
  stage: OpportunityStage;
  isWon: boolean;
  isLost: boolean;
  lastActivityAt: string | null;
  nextAction: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityPayload {
  clientId: number;
  amount: number;
  probability: number;
  stage: OpportunityStage;
  nextAction?: string | null;
  closeDate?: string | null;
  ownerId?: number | null;
}

export interface OpportunityListFilters {
  stage?: OpportunityStage[];
  clientId?: number;
  owner?: number;
  minAmount?: number;
  minProbability?: number;
  sort?: "amount" | "probability" | "closeDate" | "createdAt";
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface ProjectDto {
  id: number;
  name: string;
  clientId: number;
  clientName: string;
  ownerId: number;
  ownerName: string;
  startDate: string;
  endDate: string | null;
  progress: number;
  status: ProjectStatus;
  teamMembers: { id: number; name: string }[];
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayload {
  name: string;
  clientId: number;
  startDate: string;
  endDate?: string | null;
  progress?: number;
  status: ProjectStatus;
  teamMemberIds?: number[];
  ownerId?: number | null;
}

export interface ProjectListFilters {
  status?: ProjectStatus[];
  clientId?: number;
  page?: number;
  perPage?: number;
}

export interface ProjectTaskDto {
  id: number;
  projectId: number;
  label: string;
  status: ProjectTaskStatus;
  assigneeId: number | null;
  assigneeName: string | null;
  dueDate: string | null;
  priority: Priority;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTaskPayload {
  label: string;
  status: ProjectTaskStatus;
  assigneeId?: number | null;
  dueDate?: string | null;
  priority: Priority;
  description?: string | null;
}

export interface ActivityDto {
  id: number;
  type: ActivityType;
  title: string;
  clientId: number;
  clientName: string;
  ownerId: number;
  ownerName: string;
  scheduledAt: string;
  durationMinutes: number | null;
  status: ActivityStatus;
  priority: Priority;
  summary: string | null;
  result: string | null;
  reminderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityPayload {
  type: ActivityType;
  title: string;
  clientId: number;
  scheduledAt: string;
  durationMinutes?: number | null;
  status: ActivityStatus;
  priority: Priority;
  summary?: string | null;
  result?: string | null;
  reminderAt?: string | null;
  ownerId?: number | null;
}

export interface ActivityListFilters {
  type?: ActivityType[];
  status?: ActivityStatus[];
  clientId?: number;
  owner?: number;
  dateFrom?: string;
  dateTo?: string;
  sort?: "scheduledAt" | "createdAt";
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface DashboardStatistics {
  totalClients: number;
  prospects: number;
  activeClients: number;
  totalOpportunityValue: number;
  wonOpportunities: number;
  lostOpportunities: number;
  upcomingActivities: number;
  overdueTasks: number;
  revenueByMonth: Record<string, number>;
  clientsByStatus: Record<string, number>;
  opportunitiesByStage: Record<string, number>;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResult {
  role: UserRole;
  user: UserDto;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string | null;
}

export interface MeUpdatePayload {
  firstName: string;
  lastName: string;
  phone?: string | null;
  team?: string | null;
}

export interface UserInvitePayload {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  team?: string | null;
}

export interface UserUpdatePayload {
  role: UserRole;
  team?: string | null;
}

export type NotificationType =
  "activity_assigned" | "activity_reminder" | "opportunity_won" | "opportunity_lost" | "system";

export interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListFilters {
  unreadOnly?: boolean;
  page?: number;
  perPage?: number;
  dir?: "asc" | "desc";
}

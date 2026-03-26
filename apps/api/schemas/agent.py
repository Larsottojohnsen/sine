"""
Sine Agent – Pydantic schemas
Inspirert av OpenManus sin schema.py
"""
from __future__ import annotations
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field
import time


class AgentStatus(str, Enum):
    IDLE = "idle"
    PLANNING = "planning"
    RUNNING = "running"
    PAUSED = "paused"
    WAITING_APPROVAL = "waiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class AgentMode(str, Enum):
    SAFE = "safe"
    POWER = "power"


class AgentTask(BaseModel):
    id: str
    title: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[str] = None
    error: Optional[str] = None
    started_at: Optional[float] = None
    completed_at: Optional[float] = None


class AgentPlan(BaseModel):
    goal: str
    tasks: list[AgentTask] = []
    current_task_index: int = 0


class ToolCall(BaseModel):
    tool: str
    args: dict[str, Any] = {}
    risk_level: RiskLevel = RiskLevel.LOW


class ToolResult(BaseModel):
    tool: str
    success: bool
    output: str
    error: Optional[str] = None
    files_created: list[str] = []
    files_modified: list[str] = []


class AgentEvent(BaseModel):
    """WebSocket event sendt til frontend"""
    type: str  # plan, task_start, task_complete, tool_call, tool_result, log, file_change, approval_needed, complete, error
    timestamp: float = Field(default_factory=time.time)
    data: dict[str, Any] = {}


class ApprovalRequest(BaseModel):
    run_id: str
    tool: str
    args: dict[str, Any]
    risk_level: RiskLevel
    description: str


class ApprovalResponse(BaseModel):
    approved: bool
    run_id: str


class StartAgentRequest(BaseModel):
    task: str
    mode: AgentMode = AgentMode.SAFE
    session_id: Optional[str] = None


class AgentRunState(BaseModel):
    run_id: str
    status: AgentStatus = AgentStatus.IDLE
    mode: AgentMode = AgentMode.SAFE
    plan: Optional[AgentPlan] = None
    logs: list[str] = []
    files: dict[str, str] = {}  # path -> content
    pending_approval: Optional[ApprovalRequest] = None
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)

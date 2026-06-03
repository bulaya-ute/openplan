package com.example.openplan_mobile.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.openplan_mobile.data.models.Task
import com.example.openplan_mobile.ui.theme.Outline
import com.example.openplan_mobile.ui.theme.PriorityP1
import com.example.openplan_mobile.ui.theme.PriorityP2
import com.example.openplan_mobile.ui.theme.PriorityP3
import com.example.openplan_mobile.ui.theme.PriorityP4
import com.example.openplan_mobile.ui.theme.Primary
import com.example.openplan_mobile.ui.theme.StatusCancelled
import com.example.openplan_mobile.ui.theme.StatusDone
import com.example.openplan_mobile.ui.theme.Surface
import com.example.openplan_mobile.ui.theme.SurfaceHover
import com.example.openplan_mobile.ui.theme.TextMuted
import com.example.openplan_mobile.ui.theme.TextSecondary
import com.example.openplan_mobile.ui.util.formatDueDate
import com.example.openplan_mobile.ui.util.isDueOverdue
import com.example.openplan_mobile.ui.util.isNoDueDate

fun priorityColor(priority: String) = when (priority) {
    "P1" -> PriorityP1
    "P2" -> PriorityP2
    "P3" -> PriorityP3
    else -> PriorityP4
}

@Composable
fun TaskCard(
    task: Task,
    onTick: () -> Unit,
    onOpen: () -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    androidx.compose.material3.Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        color = Surface,
        shadowElevation = 4.dp,
        tonalElevation = 0.dp
    ) {
        Column {
            TaskRow(
                task = task,
                depth = 0,
                isExpanded = expanded,
                onTick = onTick,
                onOpen = onOpen,
                onToggleExpand = { expanded = !expanded }
            )

            AnimatedVisibility(
                visible = expanded && task.children.isNotEmpty(),
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column {
                    task.children.forEach { child ->
                        HorizontalDivider(color = Outline.copy(alpha = 0.4f), thickness = 0.5.dp)
                        TaskRow(
                            task = child,
                            depth = 1,
                            isExpanded = false,
                            onTick = onTick,
                            onOpen = onOpen,
                            onToggleExpand = {}
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TaskRow(
    task: Task,
    depth: Int,
    isExpanded: Boolean,
    onTick: () -> Unit,
    onOpen: () -> Unit,
    onToggleExpand: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val priColor = priorityColor(task.effectivePriority)
    val textDecoration = if (task.isTerminal) TextDecoration.LineThrough else TextDecoration.None
    val textColor = if (task.isTerminal) TextMuted else MaterialTheme.colorScheme.onSurface

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(interactionSource = interactionSource, indication = null) { onOpen() }
            .padding(
                start = (12 + depth * 16).dp,
                end = 12.dp,
                top = 12.dp,
                bottom = 12.dp
            ),
        verticalAlignment = Alignment.Top
    ) {
        // Expand toggle (root only with children)
        if (depth == 0 && task.hasChildren) {
            IconButton(
                onClick = onToggleExpand,
                modifier = Modifier.size(20.dp)
            ) {
                Text(
                    text = if (isExpanded) "▾" else "▸",
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
            Spacer(Modifier.width(4.dp))
        } else {
            Spacer(Modifier.width(24.dp))
        }

        // Checkbox
        Checkbox(
            task = task,
            priorityColor = priColor,
            onTick = onTick
        )

        Spacer(Modifier.width(10.dp))

        // Content
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = textColor,
                    textDecoration = textDecoration,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                if (task.effectivePriority != "P4" && !task.isTerminal) {
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = task.effectivePriority,
                        fontSize = 11.sp,
                        color = priColor,
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }

            if (task.isSequential && task.nextChildTitle != null && !task.isTerminal) {
                Text(
                    text = "Next: ${task.nextChildTitle}",
                    fontSize = 11.sp,
                    color = TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            // Due date
            val due = formatDueDate(task.dueAt)
            if (due.isNotEmpty() && !task.isTerminal) {
                val overdue = isDueOverdue(task.dueAt)
                Text(
                    text = due,
                    fontSize = 11.sp,
                    color = if (overdue) PriorityP1 else TextMuted,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            // Progress bar for root tasks with children
            if (depth == 0 && task.hasChildren && !task.isTerminal) {
                Row(
                    modifier = Modifier.padding(top = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LinearProgressIndicator(
                        progress = { task.progress.toFloat() },
                        modifier = Modifier.weight(1f).height(3.dp).clip(RoundedCornerShape(2.dp)),
                        color = Primary,
                        trackColor = Outline,
                        strokeCap = StrokeCap.Round
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "${task.completedChildCount}/${task.totalChildCount}",
                        fontSize = 10.sp,
                        color = TextMuted
                    )
                }
            }
        }
    }
}

@Composable
private fun Checkbox(task: Task, priorityColor: Color, onTick: () -> Unit) {
    val bgColor = when {
        task.isCompleted -> StatusDone
        task.isCancelled -> StatusCancelled
        else -> Color.Transparent
    }
    val borderColor = when {
        task.isCompleted -> StatusDone
        task.isCancelled -> StatusCancelled
        else -> priorityColor.copy(alpha = 0.6f)
    }

    Box(
        modifier = Modifier
            .size(20.dp)
            .clip(CircleShape)
            .background(bgColor)
            .clickable { if (!task.isTerminal) onTick() }
            .then(
                if (!task.isTerminal) Modifier else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(18.dp)
                .clip(CircleShape)
                .background(bgColor)
                .then(
                    Modifier.clip(CircleShape)
                ),
            contentAlignment = Alignment.Center
        ) {
            if (!task.isTerminal) {
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(Color.Transparent),
                    contentAlignment = Alignment.Center
                ) {
                    Surface(
                        modifier = Modifier.size(18.dp),
                        shape = CircleShape,
                        color = Color.Transparent,
                        border = androidx.compose.foundation.BorderStroke(1.5.dp, borderColor)
                    ) {}
                }
            }
            if (task.isCompleted) {
                Text("✓", fontSize = 11.sp, color = Color.White)
            } else if (task.isCancelled) {
                Text("✕", fontSize = 10.sp, color = Color.White)
            } else if (task.isSequential && task.hasChildren) {
                Text("▶", fontSize = 8.sp, color = borderColor)
            }
        }
    }
}

"""
AEGIS — Security Operations Webhook Notifier (Slack BlockKit & Discord Embeds)
Deterministic payload generator for SecOps alerts and automated incident dispatch.
Enforces Rule 08 (Risk Verdict), Rule 14 (Deterministic Patches), Rule 15 (Immutable Audit Trail).
"""

from typing import Dict, Any, Optional, List
from backend.models import InvestigationReport, Verdict, Severity


class WebhookNotifier:
    """
    Constructs deterministic webhook payloads for Slack and Discord.
    Provides safe dry-run capabilities without requiring external network connectivity.
    """

    @classmethod
    def build_slack_payload(cls, report: InvestigationReport, dashboard_url: str = "http://localhost:8000") -> Dict[str, Any]:
        """
        Builds a Slack BlockKit payload representing the investigation verdict.
        """
        status_emoji = "🔴" if report.verdict == Verdict.BLOCK else ("🟡" if report.verdict == Verdict.INSUFFICIENT_CONTEXT else "🟢")
        header_text = f"{status_emoji} AEGIS Security Verdict: {report.verdict.value}"

        blocks: List[Dict[str, Any]] = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": header_text,
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Account ID:*\n`{report.account_id}`"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Region:*\n`{report.region}`"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Completeness:*\n`{round(report.context_completeness.completeness_score * 100, 1)}%`"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Critical Violations:*\n`{report.critical_findings}`"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Justification:*\n{report.verdict_reason}"
                }
            }
        ]

        if report.attack_paths:
            ap = report.attack_paths[0]
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🚨 Critical Attack Path:*\n`{ap.entry_point}` ➔ `{ap.target_asset}`\n_{ap.narrative}_"
                }
            })

        blocks.append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "View Investigation in AEGIS",
                        "emoji": True
                    },
                    "url": f"{dashboard_url}",
                    "style": "danger" if report.verdict == Verdict.BLOCK else "primary"
                }
            ]
        })

        return {"blocks": blocks}

    @classmethod
    def build_discord_payload(cls, report: InvestigationReport, dashboard_url: str = "http://localhost:8000") -> Dict[str, Any]:
        """
        Builds a Discord Webhook Embed payload.
        """
        color_map = {
            Verdict.BLOCK: 0xE11D48,               # Red / Rose-600
            Verdict.INSUFFICIENT_CONTEXT: 0xD97706, # Amber-600
            Verdict.READY_FOR_HUMAN_REVIEW: 0x059669 # Emerald-600
        }

        embed = {
            "title": f"AEGIS Security Verdict: {report.verdict.value}",
            "description": report.verdict_reason,
            "url": dashboard_url,
            "color": color_map.get(report.verdict, 0x6B7280),
            "fields": [
                {"name": "Account", "value": f"`{report.account_id}`", "inline": True},
                {"name": "Region", "value": f"`{report.region}`", "inline": True},
                {"name": "Completeness", "value": f"`{round(report.context_completeness.completeness_score * 100, 1)}%`", "inline": True},
                {"name": "Critical Violations", "value": f"`{report.critical_findings}`", "inline": True},
                {"name": "Attack Paths", "value": f"`{len(report.attack_paths)}`", "inline": True}
            ],
            "footer": {
                "text": "AEGIS Cloud Security · Amazon Bedrock Managed Agents · Zero Cloud Mutation"
            }
        }

        if report.attack_paths:
            ap = report.attack_paths[0]
            embed["fields"].append({
                "name": "🚨 Exposed Attack Vector",
                "value": f"`{ap.entry_point}` ➔ `{ap.target_asset}`: {ap.narrative}",
                "inline": False
            })

        return {"embeds": [embed]}

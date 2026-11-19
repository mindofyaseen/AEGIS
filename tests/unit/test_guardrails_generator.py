import pytest
from integrations.bedrock.guardrails_generator import BedrockGuardrailsGenerator

def test_guardrails_generator_boto3_spec():
    spec = BedrockGuardrailsGenerator.generate_boto3_spec()
    assert spec["name"] == "aegis-cloud-security-guardrail"
    
    # Verify topics
    topics = spec["topicPolicyConfig"]["topicsConfig"]
    topic_names = [t["name"] for t in topics]
    assert "Destructive_Cloud_Mutation" in topic_names
    assert "Unqualified_Safety_Determination" in topic_names
    assert "Prompt_Injection_System_Override" in topic_names
    assert "Cross_Account_Boundary_Breach" in topic_names

    # Verify PII & Regex
    pii = spec["sensitiveInformationPolicyConfig"]["piiEntitiesConfig"]
    assert any(p["type"] == "AWS_ACCESS_KEY" for p in pii)
    assert any(p["type"] == "AWS_SECRET_KEY" for p in pii)

    regexes = spec["sensitiveInformationPolicyConfig"]["regexesConfig"]
    assert any(r["name"] == "AWSAccessKeyIdRegex" for r in regexes)

    # Verify contextual grounding threshold
    cg = spec["contextualGroundingPolicyConfig"]["filtersConfig"]
    grounding_filter = next(f for f in cg if f["type"] == "GROUNDING")
    assert grounding_filter["threshold"] >= 0.85

def test_guardrails_generator_cloudformation():
    template = BedrockGuardrailsGenerator.generate_cloudformation_template()
    assert template["AWSTemplateFormatVersion"] == "2010-09-09"
    assert "AegisBedrockGuardrail" in template["Resources"]
    props = template["Resources"]["AegisBedrockGuardrail"]["Properties"]
    assert props["Name"] == "aegis-cloud-security-guardrail"
    assert "TopicPolicyConfig" in props

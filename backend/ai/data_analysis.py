"""Natural-language analysis of participant data with PandasAI."""

import os
from typing import Any


def analyze_participants(participants: list[dict[str, Any]], question: str) -> Any:
    """Answer a question about participants using a PandasAI data frame."""
    if not question.strip():
        raise ValueError("question must not be empty")

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Add it to project/.env and restart the FastAPI backend."
        )

    try:
        import pandas as pd
        from pandasai import SmartDataframe
        from pandasai.llm.openai import OpenAI
    except ImportError as exc:
        raise RuntimeError(
            "PandasAI is not installed. Install backend/requirements.txt first."
        ) from exc

    rows = []
    for participant in participants:
        row = dict(participant)
        for key, value in row.items():
            if isinstance(value, list):
                row[key] = ", ".join(str(item) for item in value)
        rows.append(row)

    dataframe = pd.DataFrame(rows)
    smart_dataframe = SmartDataframe(
        dataframe,
        config={"llm": OpenAI(api_token=api_key)},
    )
    result = smart_dataframe.chat(question)
    return result if isinstance(result, (str, int, float, bool, list, dict)) else str(result)
import os
from pathlib import Path

class BaseProvider:
    """Abstract base class for all data providers.
    Subclasses must implement ``fetch`` to retrieve raw data and ``to_observation``
    to convert that raw payload into an :class:`Observation` Pydantic model.
    """

    async def fetch(self, *args, **kwargs):
        """Retrieve raw data from the external source.
        Should return a ``dict`` representing the raw payload.
        """
        raise NotImplementedError("Provider must implement 'fetch' method")

    def to_observation(self, raw: dict):
        """Transform raw provider payload into an ``Observation`` instance.
        Subclasses should map the raw fields to the canonical model fields.
        """
        raise NotImplementedError("Provider must implement 'to_observation' method")

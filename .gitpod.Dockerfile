FROM gitpod/workspace-full:2023-05-08-21-16-55

# Install pipx
RUN pip install pipx
RUN pipx ensurepath

# Install algokit
RUN pipx install algokit

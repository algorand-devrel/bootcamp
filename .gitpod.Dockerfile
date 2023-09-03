FROM gitpod/workspace-full:2023-08-29-11-00-25

# Install pipx
RUN pip install pipx
RUN pipx ensurepath

# Install algokit
RUN pipx install algokit==1.4.1
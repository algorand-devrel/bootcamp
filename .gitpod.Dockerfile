# Install pipx
RUN pip install pipx
RUN pipx ensurepath

# Install algokit
RUN pipx install algokit

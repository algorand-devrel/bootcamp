FROM gitpod/workspace-full 
ENV PIPX_BIN_DIR=/workspace/.pipx/bin
ENV PATH=$PIPX_BIN_DIR:$PATH
ENV PIP_USER=yes
RUN python -m pip install pipx
RUN pipx install algokit

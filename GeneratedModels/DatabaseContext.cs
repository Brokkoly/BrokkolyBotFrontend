using System;
using Microsoft.EntityFrameworkCore;
using BrokkolyBotFrontend.GeneratedModels;
using Microsoft.EntityFrameworkCore.Metadata;
using System.Configuration;
using Microsoft.Extensions.Configuration;

namespace BrokkolyBotFrontend.GeneratedModels
{
    public partial class DatabaseContext : DbContext
    {
        public DatabaseContext()
        {
        }

        public DatabaseContext(DbContextOptions<DatabaseContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Command> CommandList { get; set; }
        public virtual DbSet<Server> ServerList { get; set; }
        public virtual DbSet<TimedOutUser> TimedOutUsers { get; set; }
        public virtual DbSet<TwitchUser> TwitchUsers { get; set; }
        public virtual DbSet<RestrictedCommand> RestrictedCommands { get; set; }


        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseNpgsql(ConfigurationManager.ConnectionStrings["BrokkolyBotDatabase"].ConnectionString);
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Command>(entity =>
            {
                entity.HasKey(e => e.Id)
                    .HasName("command_list_pkey");

                entity.ToTable("command_list");

                entity.HasIndex(e => new { e.ServerId, e.CommandString })
                    .HasName("command_index");

                entity.Property(e => e.Id)
                    .HasColumnName("command_id")
                    .UseIdentityAlwaysColumn();

                entity.Property(e => e.CommandString)
                    .IsRequired()
                    .HasColumnName("command_string")
                    .HasMaxLength(50);

                entity.Property(e => e.EntryValue)
                    .IsRequired()
                    .HasColumnName("entry_value")
                    .HasMaxLength(1000);

                entity.Property(e => e.ServerId).HasColumnName("server_id");
            });



            modelBuilder.Entity<Server>(entity =>
            {
                entity.HasKey(e => e.ServerId)
                    .HasName("server_list_pkey");

                entity.ToTable("server_list");

                entity.Property(e => e.ServerId)
                    .HasColumnName("server_id")
                    .HasColumnType("character varying");

                entity.Property(e => e.BotManagerRoleId)
                    .HasColumnName("bot_manager_role_id")
                    .HasMaxLength(50);

                entity.Property(e => e.CommandPrefix)
                    .HasColumnName("command_prefix")
                    .HasMaxLength(2);

                entity.Property(e => e.TimeoutRoleId).HasColumnName("timeout_role_id");

                entity.Property(e => e.TimeoutSeconds).HasColumnName("timeout_seconds");

                entity.Property(e => e.TwitchChannel)
                    .HasColumnName("twitch_channel")
                    .HasMaxLength(50);

                entity.Property(e => e.TwitchLiveRoleId)
                    .HasColumnName("twitch_live_role_id")
                    .HasMaxLength(25);
            });

            modelBuilder.Entity<TwitchUser>(entity =>
            {
                entity.ToTable("twitch_users");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ChannelName)
                    .IsRequired()
                    .HasColumnName("channel_name")
                    .HasMaxLength(25);

                entity.Property(e => e.DiscordUserId)
                    .HasColumnName("discord_user_id")
                    .HasMaxLength(25);

                entity.Property(e => e.ServerId)
                    .IsRequired()
                    .HasColumnName("server_id")
                    .HasMaxLength(25);
            });

            modelBuilder.Entity<TimedOutUser>(entity =>
            {
                entity.HasKey(e => e.TimedOutId)
                    .HasName("timed_out_users_pkey");

                entity.ToTable("timed_out_users");

                entity.Property(e => e.TimedOutId)
                    .HasColumnName("timed_out_id")
                    .UseIdentityAlwaysColumn();

                entity.Property(e => e.ServerId).HasColumnName("server_id");

                entity.Property(e => e.TimeoutEnd).HasColumnName("timeout_end");

                entity.Property(e => e.UserId).HasColumnName("user_id");
            });

            modelBuilder.Entity<RestrictedCommand>(entity =>
            {
                entity.ToTable("restricted_commands");

                entity.HasIndex(e => e.Command)
                    .HasName("restricted_commands_command_key")
                    .IsUnique();

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .UseIdentityAlwaysColumn();

                entity.Property(e => e.Command)
                    .IsRequired()
                    .HasColumnName("command")
                    .HasMaxLength(50);
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
